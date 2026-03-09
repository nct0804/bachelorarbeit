#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PYTHON="$ROOT_DIR/.venv/bin/python"

REQUIREMENTS="$ROOT_DIR/scripts/requirements/mixed_requirement_types.txt"
RESOURCE_ROOT="$ROOT_DIR/Resource"
OUTPUT_BASE="$ROOT_DIR/Results/thesis-main"
FEATURES_OUTPUT_DIR="$ROOT_DIR/Features/generated-llm"
TOP_K="3"
STRONG_THRESHOLD="0.45"
REVIEW_THRESHOLD="0.30"
EMBEDDING_BACKEND="auto"
SEMANTIC_WEIGHT="0.85"
LEXICAL_WEIGHT="0.15"
LLM_MODEL="gemini-3-flash-preview"
LLM_TEMPERATURE="0.1"
LLM_MAX_TOKENS="700"
LLM_DRY_RUN="false"
LLM_CA_BUNDLE=""
LLM_INSECURE_SKIP_TLS_VERIFY="false"
DISABLE_NLP_PREPROCESS="false"

usage() {
    cat <<EOF
Run thesis main path:
Requirements -> semantic_mapper -> RAG payload -> LLM executable Gherkin.

Usage:
  scripts/run_thesis_main_pipeline.sh [options]

Options:
  --requirements PATH          Requirements dataset.
  --resource-root PATH         Robot resource root.
  --output-base PATH           Output base folder.
  --features-output-dir PATH   Output folder for generated .feature files.
  --top-k N                    Top-k candidates in semantic mapping.
  --strong-threshold FLOAT     AUTO threshold.
  --review-threshold FLOAT     REVIEW threshold.
  --embedding-backend NAME     auto|local|sentence-transformers (default: auto).
  --semantic-weight FLOAT      Semantic score weight.
  --lexical-weight FLOAT       Lexical score weight.
  --llm-model NAME             LLM model for generation.
  --llm-temperature FLOAT      LLM sampling temperature.
  --llm-max-tokens INT         LLM max output tokens per requirement.
  --llm-ca-bundle PATH         CA bundle (PEM) for LLM HTTPS calls.
  --llm-insecure-skip-tls-verify  Disable TLS verification (debug only).
  --llm-dry-run                Skip API calls and generate deterministic baseline features.
  --disable-nlp-preprocess     Disable NLP preprocessing.
  -h, --help                   Show help.
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
        --resource-root)
            RESOURCE_ROOT="$(resolve_path "$2")"
            shift 2
            ;;
        --output-base)
            OUTPUT_BASE="$(resolve_path "$2")"
            shift 2
            ;;
        --features-output-dir)
            FEATURES_OUTPUT_DIR="$(resolve_path "$2")"
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
        --llm-model)
            LLM_MODEL="$2"
            shift 2
            ;;
        --llm-temperature)
            LLM_TEMPERATURE="$2"
            shift 2
            ;;
        --llm-max-tokens)
            LLM_MAX_TOKENS="$2"
            shift 2
            ;;
        --llm-ca-bundle)
            LLM_CA_BUNDLE="$(resolve_path "$2")"
            shift 2
            ;;
        --llm-insecure-skip-tls-verify)
            LLM_INSECURE_SKIP_TLS_VERIFY="true"
            shift
            ;;
        --llm-dry-run)
            LLM_DRY_RUN="true"
            shift
            ;;
        --disable-nlp-preprocess)
            DISABLE_NLP_PREPROCESS="true"
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

PYTHON_CMD="$(resolve_python)"
PYTHON_RUNNER=()
build_python_runner
MAPPING_DIR="$OUTPUT_BASE/semantic-mapping"
RAG_DIR="$OUTPUT_BASE/rag-context"
LLM_RESULTS_DIR="$OUTPUT_BASE/llm-generation"

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

PAYLOAD_CMD=(
    "${PYTHON_RUNNER[@]}" "$ROOT_DIR/src/components/semantic/llm_payload_builder.py"
    --mapping-report "$MAPPING_DIR/mapping_report.csv"
    --keyword-catalog "$MAPPING_DIR/keyword_catalog.csv"
    --output-json "$RAG_DIR/llm_generation_payload.json"
    --output-summary "$RAG_DIR/summary.md"
    --review-threshold "$REVIEW_THRESHOLD"
    --strong-threshold "$STRONG_THRESHOLD"
)

LLM_CMD=(
    "${PYTHON_RUNNER[@]}" "$ROOT_DIR/src/components/semantic/llm_gherkin_generator.py"
    --payload-json "$RAG_DIR/llm_generation_payload.json"
    --features-output-dir "$FEATURES_OUTPUT_DIR"
    --results-dir "$LLM_RESULTS_DIR"
    --model "$LLM_MODEL"
    --temperature "$LLM_TEMPERATURE"
    --max-tokens "$LLM_MAX_TOKENS"
)

if [[ -n "$LLM_CA_BUNDLE" ]]; then
    LLM_CMD+=(--ca-bundle "$LLM_CA_BUNDLE")
fi

if [[ "$DISABLE_NLP_PREPROCESS" == "true" ]]; then
    MAPPER_CMD+=(--disable-nlp-preprocess)
fi

if [[ "$LLM_DRY_RUN" == "true" ]]; then
    LLM_CMD+=(--dry-run)
fi

if [[ "$LLM_INSECURE_SKIP_TLS_VERIFY" == "true" ]]; then
    LLM_CMD+=(--insecure-skip-tls-verify)
fi

echo "Step 1/3: Running semantic mapping..."
"${MAPPER_CMD[@]}"

echo "Step 2/3: Building LLM payload from semantic mapping output..."
"${PAYLOAD_CMD[@]}"

echo "Step 3/3: Generating executable Gherkin with LLM..."
"${LLM_CMD[@]}"

cat <<EOF

Thesis main pipeline completed.
- Semantic mapping: $MAPPING_DIR
- LLM payload: $RAG_DIR/llm_generation_payload.json
- Payload summary: $RAG_DIR/summary.md
- Generated features: $FEATURES_OUTPUT_DIR
- LLM generation summary: $LLM_RESULTS_DIR/summary.md
EOF
