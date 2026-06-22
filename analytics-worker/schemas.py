import json
import math
from datetime import datetime, timezone


def clamp(value, minimum=0, maximum=100):
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0
    if math.isnan(number) or math.isinf(number):
        number = 0
    return int(max(minimum, min(maximum, round(number))))


def safe_number(value, fallback=0):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return fallback
    if math.isnan(number) or math.isinf(number):
        return fallback
    return number


def compact_date(value):
    if not value:
        return None
    try:
        normalized = str(value).replace("Z", "+00:00")
        return datetime.fromisoformat(normalized).astimezone(timezone.utc)
    except ValueError:
        return None


def clean_text(value, fallback=""):
    if value is None:
        return fallback
    return str(value).strip()


def success_response(task, data, warnings=None, confidence=0.0):
    return {
        "success": True,
        "task": task,
        "data": data or {},
        "warnings": warnings or [],
        "confidence": round(float(confidence or 0), 2),
    }


def error_response(task, message, warnings=None):
    return {
        "success": False,
        "task": task,
        "message": clean_text(message, "Analysis failed."),
        "warnings": warnings or [],
        "confidence": 0,
    }


def write_json(payload):
    print(json.dumps(payload, separators=(",", ":"), ensure_ascii=True))
