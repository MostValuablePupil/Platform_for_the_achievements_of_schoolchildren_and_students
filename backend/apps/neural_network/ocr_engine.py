from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps
from paddleocr import PaddleOCR


DEFAULT_CPU_THREADS = min(10, max(4, os.cpu_count() or 4))
MAX_OCR_IMAGE_SIDE = 2200
MIN_OCR_IMAGE_SIDE = 900


LANGUAGE_GROUPS = {
    "ch": {"ch", "en", "japan", "chinese_cht"},
    "korean": {"korean", "en"},
    "ru": {"ru", "be", "uk", "en"},
    "bg": {
        "ru",
        "be",
        "uk",
        "bg",
        "mn",
        "abq",
        "ady",
        "kbd",
        "ava",
        "dar",
        "inh",
        "ce",
        "lki",
        "lez",
        "tab",
        "kk",
        "ky",
        "tg",
        "mk",
        "tt",
        "cv",
        "ba",
        "mhr",
        "mo",
        "udm",
        "kv",
        "os",
        "bua",
        "xal",
        "tyv",
        "sah",
        "kaa",
        "en",
    },
    "th": {"th", "en"},
    "el": {"el", "en"},
    "ar": {"ar", "fa", "ug", "ur", "ps", "ku", "sd", "bal", "en"},
    "hi": {"hi", "mr", "ne", "bh", "mai", "ang", "bho", "mah", "sck", "new", "gom", "sa", "bgc", "en"},
    "ta": {"ta", "en"},
    "te": {"te", "en"},
}

LATIN_CODES = {
    "fr", "de", "af", "it", "es", "bs", "pt", "cs", "cy", "da", "et", "ga", "hr", "uz",
    "hu", "rs_latin", "id", "oc", "is", "lt", "mi", "ms", "nl", "no", "pl", "sk", "sl",
    "sq", "sv", "sw", "tl", "tr", "la", "az", "lv", "mt", "pi", "ro", "vi", "fi", "eu",
    "gl", "lb", "rm", "ca", "qu",
}


@dataclass
class OCRResult:
    image_path: Path
    prepared_image_path: Path
    extracted_text: str
    json_data: dict
    json_path: Path | None = None


class PaddleOCREngine:
    def __init__(self, output_dir: str | Path = "output") -> None:
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self._ocr_engine: PaddleOCR | None = None
        self._ocr_lang = ""

    def recognize(
        self,
        image_path: str | Path,
        lang: str = "",
        save_artifacts: bool = True,
    ) -> OCRResult:
        source_path = Path(image_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Image not found: {source_path}")

        resolved_lang = self.resolve_requested_lang(lang)
        ocr = self._get_ocr_engine(resolved_lang)
        prepared_image_path = self.prepare_image_for_ocr(source_path)
        try:
            result = ocr.predict(str(prepared_image_path))
            if not result:
                raise RuntimeError("PaddleOCR did not return any results.")

            first_result = result[0]
            result_data = first_result.json.get("res", {})
            recognized_texts = result_data.get("rec_texts", [])
            extracted_text = "\n".join(text.strip() for text in recognized_texts if text.strip())
            if not extracted_text:
                extracted_text = "Текст не найден."

            json_path = None
            if save_artifacts:
                json_path = self.output_dir / f"{source_path.stem}_result.json"
                with json_path.open("w", encoding="utf-8") as file:
                    json.dump(first_result.json, file, ensure_ascii=False, indent=2)

            return OCRResult(
                image_path=source_path,
                prepared_image_path=prepared_image_path,
                extracted_text=extracted_text,
                json_data=first_result.json,
                json_path=json_path,
            )
        finally:
            if prepared_image_path != source_path and prepared_image_path.exists():
                prepared_image_path.unlink()

    def _get_ocr_engine(self, requested_lang: str) -> PaddleOCR:
        if self._ocr_engine is not None and self._ocr_lang == requested_lang:
            return self._ocr_engine

        kwargs = {
            "device": "cpu",
            "enable_mkldnn": False,
            "cpu_threads": DEFAULT_CPU_THREADS,
            "use_doc_orientation_classify": False,
            "use_doc_unwarping": False,
            "use_textline_orientation": False,
        }
        if requested_lang:
            kwargs["lang"] = requested_lang

        self._ocr_engine = PaddleOCR(**kwargs)
        self._ocr_lang = requested_lang
        return self._ocr_engine

    def prepare_image_for_ocr(self, image_path: str | Path) -> Path:
        source_path = Path(image_path)
        with Image.open(source_path) as source_image:
            image = ImageOps.exif_transpose(source_image).convert("RGB")
            width, height = image.size
            longest_side = max(width, height)
            shortest_side = max(1, min(width, height))
            scale_factor = 1.0

            if longest_side > MAX_OCR_IMAGE_SIDE:
                scale_factor = MAX_OCR_IMAGE_SIDE / longest_side
            elif shortest_side < MIN_OCR_IMAGE_SIDE:
                scale_factor = min(1.35, MIN_OCR_IMAGE_SIDE / shortest_side)

            if abs(scale_factor - 1.0) < 0.05:
                return source_path

            prepared_path = self.output_dir / f"{source_path.stem}_prepared.png"
            resized = image.resize(
                (
                    max(1, int(image.width * scale_factor)),
                    max(1, int(image.height * scale_factor)),
                ),
                Image.Resampling.LANCZOS,
            )
            resized.save(prepared_path)

        return prepared_path

    @staticmethod
    def resolve_requested_lang(raw_value: str) -> str:
        if not raw_value:
            return ""

        tokens = [token.strip().lower() for token in re.split(r"[\s,;/]+", raw_value) if token.strip()]
        if not tokens:
            return ""

        unique_tokens = list(dict.fromkeys(tokens))
        if len(unique_tokens) == 1:
            return unique_tokens[0]

        token_set = set(unique_tokens)

        if token_set.issubset(LATIN_CODES | {"en"}):
            for token in unique_tokens:
                if token in LATIN_CODES:
                    return token
            return "en"

        for model_lang, supported_codes in LANGUAGE_GROUPS.items():
            if token_set.issubset(supported_codes):
                if model_lang in token_set:
                    return model_lang
                for token in unique_tokens:
                    if token in supported_codes and token != "en":
                        return token
                return model_lang

        supported_groups = "совместимые примеры: ru,en | fr,de | ar,en | hi,mr,en | ch,en,japan"
        raise ValueError(
            "PaddleOCR не принимает список языков напрямую. "
            f"Комбинация '{raw_value}' не относится к одной совместимой группе; {supported_groups}."
        )


def recognize_image(
    image_path: str | Path,
    lang: str = "",
    output_dir: str | Path = "output",
    save_artifacts: bool = True,
) -> OCRResult:
    engine = PaddleOCREngine(output_dir=output_dir)
    return engine.recognize(image_path=image_path, lang=lang, save_artifacts=save_artifacts)
