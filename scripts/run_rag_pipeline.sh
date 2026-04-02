#!/usr/bin/env bash

# Helper script to quickly run the RAG Generator pipeline.
# Usage for String:  ./scripts/run_rag_pipeline.sh "REQUIREMENT_TEXT" "OUTPUT_FILE.robot"
# Usage for File:    ./scripts/run_rag_pipeline.sh "path/to/requirements.csv" "OUTPUT_FILE.robot"
# Usage for Feature: ./scripts/run_rag_pipeline.sh "Features/achievements_validation.feature" "OUTPUT_FILE.robot"
# Usage for Dir:     ./scripts/run_rag_pipeline.sh "Features/" "OUTPUT_DIR"

#./scripts/run_rag_pipeline.sh "scripts/requirements/mixed_requirement_types.csv" "robot-tests2/mixed_requirements.robot"
# ./scripts/run_rag_pipeline.sh "Features/" "robot-tests2/all_features.robot"

#example Input and output file if running the whole file!
INPUT=${1:-"As a user, I want to navigate to the inbox page and check if there is at least 1 notification list item."}
OUTPUT_FILE=${2:-"robot-tests/generated_rag_test.robot"}

echo "Running RAG Generator Pipeline..."
echo "Input: $INPUT"
echo "Output: $OUTPUT_FILE"
echo "--------------------------------------------------------"

source .venv/bin/activate
export PYTHONPATH=.

# Check if input is a valid file or directory path that exists, otherwise treat as a single string requirement
if [ -e "$INPUT" ]; then
    python3 src/components/rag/pipeline/rag_generator.py \
        --input-file "$INPUT" \
        --resource-root "Resource" \
        --top-k 12 \
        --output "$OUTPUT_FILE"
else
    python3 src/components/rag/pipeline/rag_generator.py \
        --requirement "$INPUT" \
        --resource-root "Resource" \
        --top-k 12 \
        --output "$OUTPUT_FILE"
fi
