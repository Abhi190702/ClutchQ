import json
import sys

from gameplay_graph import compute_teammate_fit, rebuild_gameplay_graph
from rhythm import build_rhythm
from schemas import error_response, success_response, write_json
from scoring import analyze_scorecard


TASKS = {
    "analyze_scorecard": analyze_scorecard,
    "build_rhythm": build_rhythm,
    "rebuild_gameplay_graph": rebuild_gameplay_graph,
    "compute_teammate_fit": compute_teammate_fit,
}

MAX_INPUT_BYTES = 2 * 1024 * 1024


def main():
    raw_bytes = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    if len(raw_bytes) > MAX_INPUT_BYTES:
        write_json(error_response("unknown", "Analytics payload is too large."))
        return

    try:
        raw = raw_bytes.decode("utf-8")
        request = json.loads(raw or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        write_json(error_response("unknown", "Input must be valid JSON."))
        return

    if not isinstance(request, dict):
        write_json(error_response("unknown", "Input must be a JSON object."))
        return

    task = request.get("task")
    payload = request.get("payload") or {}

    if not isinstance(payload, dict):
        write_json(error_response(task or "unknown", "Analytics payload must be a JSON object."))
        return

    if task not in TASKS:
        write_json(error_response(task or "unknown", "Unsupported analytics task."))
        return

    try:
        data = TASKS[task](payload)
        warnings = data.pop("warnings", []) if isinstance(data, dict) else []
        confidence = data.pop("confidence", request.get("confidence", 0.0)) if isinstance(data, dict) else 0.0
        write_json(success_response(task, data, warnings, confidence))
    except Exception as error:
        print(f"analytics-worker error: {error}", file=sys.stderr)
        write_json(error_response(task, "Analytics worker failed safely."))


if __name__ == "__main__":
    main()
