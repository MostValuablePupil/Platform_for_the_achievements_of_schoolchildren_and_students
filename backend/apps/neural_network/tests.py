from unittest.mock import patch

from django.test import SimpleTestCase

from .ocr_engine import PaddleOCREngine


class PaddleOCREngineRuntimeTests(SimpleTestCase):
    def test_default_runtime_uses_stable_cpu_without_accelerators(self):
        kwargs = PaddleOCREngine._build_ocr_kwargs()

        self.assertEqual(kwargs["device"], "cpu")
        self.assertFalse(kwargs["enable_mkldnn"])
        self.assertFalse(kwargs["use_tensorrt"])
        self.assertEqual(kwargs["mkldnn_cache_capacity"], 0)

    @patch.dict(
        "os.environ",
        {
            "PADDLE_OCR_DEVICE": "gpu:0",
            "PADDLE_OCR_USE_TENSORRT": "1",
            "PADDLE_OCR_ENABLE_MKLDNN": "1",
        },
        clear=False,
    )
    def test_safe_cpu_runtime_disables_gpu_tensorrt_and_mkldnn(self):
        kwargs = PaddleOCREngine._build_ocr_kwargs(force_safe_cpu=True)

        self.assertEqual(kwargs["device"], "cpu")
        self.assertFalse(kwargs["enable_mkldnn"])
        self.assertFalse(kwargs["use_tensorrt"])
