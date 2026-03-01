#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python"

REQUIREMENTS="$ROOT_DIR/scripts/requirements/mixed_requirement_types.txt"
PHRASE_MAP_FILE="$ROOT_DIR/scripts/requirements/phrase_map.json"
RESOURCE_ROOT="$ROOT_DIR/Resource"
OUTPUT_BASE="$ROOT_DIR/Results"

TOP_K="3"
STRONG_THRESHOLD="0.45"
REVIEW_THRESHOLD="0.30"
EMBEDDING_BACKEND="auto"
SEMANTIC_WEIGHT="0.85"
LEXICAL_WEIGHT="0.15"
DISABLE_NLP_PREPROCESS="false"
GENERATE_FIGURES="false"

usage() {
    cat <<EOF
Run semantic mapping pipeline (mapper -> evaluation -> readable report).

Usage:
  scripts/run_semantic_pipeline.sh [options]

Options:
  --requirements PATH          Requirements file (default: scripts/requirements/mixed_requirement_types.txt)
  --phrase-map-file PATH       Phrase map JSON file (default: scripts/requirements/phrase_map.json)
  --no-phrase-map              Disable phrase map usage
  --resource-root PATH         Robot resource root (default: Resource)
  --output-base PATH           Output base directory (default: Results)
  --top-k N                    Top K matches (default: 3)
  --strong-threshold FLOAT     AUTO threshold (default: 0.45)
  --review-threshold FLOAT     REVIEW threshold (default: 0.30)
  --embedding-backend NAME     auto|local|sentence-transformers (default: auto)
  --semantic-weight FLOAT      Semantic weight (default: 0.85)
  --lexical-weight FLOAT       Lexical weight (default: 0.15)
  --disable-nlp-preprocess     Disable NLP preprocessing
  --generate-figures           Generate matplotlib report figures
  -h, --help                   Show this help
EOF
}

resolve_python() {
    if [[ -x "$VENV_PYTHON" ]]; then
        printf "%s" "$VENV_PYTHON"
    else
        printf "%s" "python3"
    fi
}

build_python_runner() {
    PYTHON_RUNNER=("$PYTHON_CMD")
    if [[ "$(uname -s)" != "Darwin" ]]; then
        return
    fi
    local current_arch
    current_arch="$(arch)"
    if [[ "$current_arch" == "x86_64" || "$current_arch" == "i386" ]]; then
        if command -v arch >/dev/null 2>&1 && arch -arm64 /usr/bin/true >/dev/null 2>&1; then
            PYTHON_RUNNER=(arch -arm64 "$PYTHON_CMD")
        fi
    fi
}

resolve_path() {
    local path_value="$1"
    if [[ "$path_value" = /* ]]; then
        printf "%s" "$path_value"
    else
        printf "%s/%s" "$ROOT_DIR" "$path_value"
    fi
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --requirements)
            REQUIREMENTS="$(resolve_path "$2")"
            shift 2
            ;;
        --phrase-map-file)
            PHRASE_MAP_FILE="$(resolve_path "$2")"
            shift 2
            ;;
        --no-phrase-map)
            PHRASE_MAP_FILE=""
            shift
            ;;
        --resource-root)
            RESOURCE_ROOT="$(resolve_path "$2")"
            shift 2
            ;;
        --output-base)
            OUTPUT_BASE="$(resolve_path "$2")"
            shift 2
            ;;
        --top-k)
            TOP_K="$2"
            shift 2
            ;;
        --strong-threshold)
            STRONG_THRESHOLD="$2"
            shift 2
            ;;
        --review-threshold)
            REVIEW_THRESHOLD="$2"
            shift 2
            ;;
        --embedding-backend)
            EMBEDDING_BACKEND="$2"
            shift 2
            ;;
        --semantic-weight)
            SEMANTIC_WEIGHT="$2"
            shift 2
            ;;
        --lexical-weight)
            LEXICAL_WEIGHT="$2"
            shift 2
            ;;
        --disable-nlp-preprocess)
            DISABLE_NLP_PREPROCESS="true"
            shift
            ;;
        --generate-figures)
            GENERATE_FIGURES="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage
            exit 2
            ;;
    esac
done

if [[ ! -f "$REQUIREMENTS" ]]; then
    echo "Requirements file not found: $REQUIREMENTS" >&2
    exit 2
fi

if [[ ! -d "$RESOURCE_ROOT" ]]; then
    echo "Resource root not found: $RESOURCE_ROOT" >&2
    exit 2
fi

if [[ -n "$PHRASE_MAP_FILE" ]] && [[ ! -f "$PHRASE_MAP_FILE" ]]; then
    echo "Phrase map file not found: $PHRASE_MAP_FILE" >&2
    exit 2
fi

MAPPING_DIR="$OUTPUT_BASE/semantic-mapping"
EVAL_DIR="$OUTPUT_BASE/semantic-evaluation"
REPORT_DIR="$OUTPUT_BASE/semantic-readable-report"
PYTHON_CMD="$(resolve_python)"
PYTHON_RUNNER=()
MPL_CONFIG_DIR="$OUTPUT_BASE/.matplotlib"
XDG_CACHE_DIR="$OUTPUT_BASE/.cache"

mkdir -p "$MPL_CONFIG_DIR" "$XDG_CACHE_DIR"
build_python_runner

MAPPER_CMD=(
    "${PYTHON_RUNNER[@]}" "$ROOT_DIR/src/components/semantic/semantic_mapper.py"
    --requirements "$REQUIREMENTS"
    --resource-root "$RESOURCE_ROOT"
    --output-dir "$MAPPING_DIR"
    --top-k "$TOP_K"
    --strong-threshold "$STRONG_THRESHOLD"
    --review-threshold "$REVIEW_THRESHOLD"
    --embedding-backend "$EMBEDDING_BACKEND"
    --semantic-weight "$SEMANTIC_WEIGHT"
    --lexical-weight "$LEXICAL_WEIGHT"
)

EVAL_CMD=(
    "${PYTHON_RUNNER[@]}" "$ROOT_DIR/src/components/semantic/semantic_evaluation.py"
    --requirements "$REQUIREMENTS"
    --resource-root "$RESOURCE_ROOT"
    --output-root "$EVAL_DIR"
    --top-k "$TOP_K"
    --strong-threshold "$STRONG_THRESHOLD"
    --review-threshold "$REVIEW_THRESHOLD"
)

if [[ -n "$PHRASE_MAP_FILE" ]]; then
    MAPPER_CMD+=(--phrase-map-file "$PHRASE_MAP_FILE")
    EVAL_CMD+=(--phrase-map-file "$PHRASE_MAP_FILE")
fi

if [[ "$DISABLE_NLP_PREPROCESS" == "true" ]]; then
    MAPPER_CMD+=(--disable-nlp-preprocess)
    EVAL_CMD+=(--disable-nlp-preprocess)
fi

echo "Running mapper..."
"${MAPPER_CMD[@]}"

echo "Running evaluation..."
"${EVAL_CMD[@]}"

echo "Generating readable report..."
REPORT_CMD=(
    "${PYTHON_RUNNER[@]}" "$ROOT_DIR/src/components/semantic/semantic_report.py"
    --metrics-csv "$EVAL_DIR/metrics.csv" \
    --runs-root "$EVAL_DIR/runs" \
    --output-dir "$REPORT_DIR"
)
if [[ "$GENERATE_FIGURES" == "true" ]]; then
    REPORT_CMD+=(--generate-figures)
fi
MPLCONFIGDIR="$MPL_CONFIG_DIR" XDG_CACHE_HOME="$XDG_CACHE_DIR" \
"${REPORT_CMD[@]}"

cat <<EOF

Pipeline completed.
- Python:   $PYTHON_CMD
- Launch:   ${PYTHON_RUNNER[*]}
- Mapping:  $MAPPING_DIR
- Evaluation: $EVAL_DIR
- Report:   $REPORT_DIR
EOF
