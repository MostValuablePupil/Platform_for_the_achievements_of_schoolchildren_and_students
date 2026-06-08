import hashlib
import json
import logging
import re

import requests

logger = logging.getLogger(__name__)

BASE = "https://diploma.rsr-olymp.ru/files/rsosh-diplomas-static"
HEADERS = {"User-Agent": "Mozilla/5.0"}


def _js_title_case(s: str) -> str:
    """Replicate JS: namestring.replace(/(([- ]|^)[^ ])/g, s => s.toUpperCase())"""
    result = []
    capitalize_next = True
    for char in s:
        if char in (' ', '-'):
            result.append(char)
            capitalize_next = True
        elif capitalize_next:
            result.append(char.upper())
            capitalize_next = False
        else:
            result.append(char)
    return ''.join(result)


def compute_person_hash(
    last_name: str, first_name: str, middle_name: str,
    birth_year: int, birth_month: int, birth_day: int,
) -> str:
    """Compute SHA-256 hash used by diploma.rsr-olymp.ru for person lookup."""
    namestring = f"{last_name} {first_name} {middle_name}"
    namestring = _js_title_case(namestring.lower())
    namestring = f"{namestring} {birth_year:04d}-{birth_month:02d}-{birth_day:02d}"
    namestring = re.sub(r' +', ' ', namestring)
    return hashlib.sha256(namestring.encode('utf-8')).hexdigest()


def fetch_rsr_diplomas(
    last_name: str, first_name: str, middle_name: str,
    birth_year: int, birth_month: int, birth_day: int,
    year: int = 2025,
) -> list[dict]:
    """
    Fetch olympiad diplomas for a person from diploma.rsr-olymp.ru.

    Returns list of dicts: {code, olympiad, name, form, pdf_url, year}.
    Returns [] if no diplomas found.
    Raises requests.RequestException on network errors.
    """
    h = compute_person_hash(last_name, first_name, middle_name,
                             birth_year, birth_month, birth_day)
    url = f"{BASE}/compiled-storage-{year}/by-person-released/{h}/codes.js"

    logger.info("RSR diploma lookup: GET %s", url)
    resp = requests.get(url, timeout=15, headers=HEADERS)
    logger.info("RSR diploma lookup: status=%s", resp.status_code)
    if resp.status_code == 404:
        return []
    if not resp.ok:
        logger.error("RSR diploma lookup failed: status=%s body=%.500s", resp.status_code, resp.text)
        raise requests.HTTPError(f"diploma.rsr-olymp.ru вернул {resp.status_code}", response=resp)
    resp.raise_for_status()

    match = re.search(r'diplomaCodes\s*=\s*(\[[\s\S]*?\]);', resp.text)
    if not match:
        return []

    raw_js = match.group(1)
    # Quote unquoted JS keys: code: → "code":
    raw_json = re.sub(r"(?<=[{,\[])\s*([a-zA-Z_]\w*)\s*:", r'"\1":', raw_js)
    # Replace single-quoted strings with double-quoted, escaping inner double quotes
    raw_json = re.sub(r"'([^']*)'", lambda m: '"' + m.group(1).replace('"', '\\"') + '"', raw_json)
    # Remove trailing commas before ] or }
    raw_json = re.sub(r',\s*([}\]])', r'\1', raw_json)
    raw = json.loads(raw_json)
    code_base = f"{BASE}/compiled-storage-{year}/by-code"

    return [
        {
            'code': d['code'],
            'olympiad': d.get('oa', ''),
            'name': d.get('name', ''),
            'form': d.get('form', ''),
            'pdf_url': f"{code_base}/{d['code']}/color.pdf",
            'year': year,
        }
        for d in raw
        if not d.get('failure')
    ]
