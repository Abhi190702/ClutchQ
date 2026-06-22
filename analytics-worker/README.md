# ClutchQ Gameplay Intelligence Worker

This worker is an internal analytics process used by the Node/Express API. It is not a public backend and does not expose a network port.

## Contract

The worker reads one JSON request from `stdin`:

```json
{ "task": "analyze_scorecard", "payload": {} }
```

It prints one JSON response to `stdout`:

```json
{ "success": true, "task": "analyze_scorecard", "data": {}, "warnings": [], "confidence": 0.84 }
```

Logs, if needed, go to `stderr` only.

## Supported Tasks

- `analyze_scorecard`
- `build_rhythm`
- `rebuild_gameplay_graph`
- `compute_teammate_fit`

## Dependencies

This first stable version uses only the Python standard library. OCR can be added later with Pillow, pytesseract, or OpenCV, but those packages are intentionally not required for the hackathon demo.

## Local Test

```bash
python analytics-worker/main.py < analytics-worker/sample_inputs/session_bundle.json
python analytics-worker/main.py < analytics-worker/sample_inputs/valorant_scorecard.json
```

If `python` is unavailable, try `python3`.
