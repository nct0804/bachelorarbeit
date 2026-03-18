#!/bin/zsh
set -euo pipefail

REQS_PATH="${1:-Features}"
RESOURCE_ROOT="${2:-Resource}"
OUTPUT_ROOT="${3:-Results/semantic-mapping-quoted-ablation}"
KEYWORD_SCOPE="${4:-common}"
TOP_K="${5:-3}"

IGNORE_OUT="${OUTPUT_ROOT}/ignore-quoted"
USE_OUT="${OUTPUT_ROOT}/use-quoted"
DIFF_OUT="${OUTPUT_ROOT}/diff.csv"

python3 src/components/semantic/semantic_mapper.py \
  --requirements "${REQS_PATH}" \
  --resource-root "${RESOURCE_ROOT}" \
  --output-dir "${IGNORE_OUT}" \
  --top-k "${TOP_K}" \
  --keyword-scope "${KEYWORD_SCOPE}" \
  --ignore-quoted-text

python3 src/components/semantic/semantic_mapper.py \
  --requirements "${REQS_PATH}" \
  --resource-root "${RESOURCE_ROOT}" \
  --output-dir "${USE_OUT}" \
  --top-k "${TOP_K}" \
  --keyword-scope "${KEYWORD_SCOPE}" \
  --use-quoted-text

python3 scripts/compare_mapping_reports.py \
  --baseline "${IGNORE_OUT}/mapping_report.csv" \
  --variant "${USE_OUT}/mapping_report.csv" \
  --output "${DIFF_OUT}"

printf "\nQuoted-text ablation complete:\n"
printf "- Ignore quoted: %s\n" "${IGNORE_OUT}"
printf "- Use quoted: %s\n" "${USE_OUT}"
printf "- Diff: %s\n" "${DIFF_OUT}"
