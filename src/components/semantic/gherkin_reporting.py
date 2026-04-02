#!/usr/bin/env python3
"""Reporting helpers for the Gherkin generation pipeline."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from src.components.semantic.gherkin_support import FeatureDocument, StepExecutionPlan


def write_feature_analysis_json(
    output_path: Path,
    feature: FeatureDocument,
    scenario_plans: list[list[StepExecutionPlan]],
) -> None:
    scenarios_payload = []
    for scenario, plan in zip(feature.scenarios, scenario_plans):
        scenarios_payload.append(
            {
                "name": scenario.name,
                "tags": scenario.tags,
                "steps": [
                    {
                        "line": item.source_step.line_number,
                        "clause": item.source_step.clause,
                        "original_text": item.source_step.text,
                        "generated_keyword": item.generated_keyword_name,
                        "mapped_keyword": item.mapped_keyword_name,
                        "mapped_arguments": item.mapped_arguments,
                        "intent": item.intent,
                        "match_source": item.match_source,
                        "confidence": item.confidence,
                    }
                    for item in plan
                ],
            }
        )

    payload = {
        "feature_name": feature.feature_name,
        "source_file": feature.source_file,
        "scenario_count": len(feature.scenarios),
        "scenarios": scenarios_payload,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_pipeline_reports(
    analysis_dir: Path,
    *,
    features_root: Path,
    resource_root: Path,
    output_root: Path,
    catalog_size: int,
    features_processed: int,
    total_generated_steps: int,
    aggregate_rows: list[dict[str, str | int]],
) -> dict:
    analysis_dir.mkdir(parents=True, exist_ok=True)

    summary_payload = {
        "features_root": str(features_root),
        "resource_root": str(resource_root),
        "output_root": str(output_root),
        "analysis_dir": str(analysis_dir),
        "catalog_size": catalog_size,
        "features_processed": features_processed,
        "generated_steps": total_generated_steps,
    }
    (analysis_dir / "pipeline_summary.json").write_text(
        json.dumps(summary_payload, indent=2),
        encoding="utf-8",
    )

    with (analysis_dir / "generated_artifacts.csv").open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(
            file_handle,
            fieldnames=[
                "FEATURE_INDEX",
                "FEATURE_NAME",
                "SOURCE_FILE",
                "SCENARIOS",
                "GENERATED_STEPS",
                "ROBOT_FILE",
                "RESOURCE_FILE",
            ],
        )
        writer.writeheader()
        for row in aggregate_rows:
            writer.writerow(row)

    return summary_payload
