#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PYTHON_BIN="${PYTHON_BIN:-./.venv/bin/python}"
OUTPUT_DIR="${OUTPUT_DIR:-Results/rq2-executability-proposed}"

"$PYTHON_BIN" scripts/evaluate_executability.py \
    --system proposed \
    --output-dir "$OUTPUT_DIR"
