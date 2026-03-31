#!/usr/bin/env python3
"""Generate executable Robot artifacts from Gherkin feature files."""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path


CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from src.components.semantic.gherkin_reporting import (
    write_feature_analysis_json,
    write_pipeline_reports,
)
from src.components.semantic.gherkin_support import (
    FeatureDocument,
    GherkinStepMapper,
    StepExecutionPlan,
    load_feature_documents,
    sanitize_keyword_title,
)

DEFAULT_ANALYSIS_DIR = "Results/gherkin_pipeline"


class FeatureExecutionPipeline:
    """Convert `.feature` files into executable `.robot` and `.resource` outputs."""

    def __init__(
        self,
        features_root: Path,
        resource_root: Path,
        output_root: Path,
        analysis_dir: Path | None = None,
        clean_output: bool = True,
        ignore_quoted_text: bool = True,
        semantic_weight: float = 0.85,
        lexical_weight: float = 0.15,
        embedding_dim: int = 384,
    ) -> None:
        self.features_root = features_root
        self.resource_root = resource_root
        self.output_root = output_root
        self.analysis_dir = analysis_dir
        self.clean_output = clean_output
        self.matcher = GherkinStepMapper.from_resource_root(
            resource_root=resource_root,
            ignore_quoted_text=ignore_quoted_text,
            semantic_weight=semantic_weight,
            lexical_weight=lexical_weight,
            embedding_dim=embedding_dim,
        )

    def run(self) -> dict:
        if not self.features_root.exists():
            raise SystemExit(f"Features root not found: {self.features_root}")
        if not self.resource_root.exists():
            raise SystemExit(f"Resource root not found: {self.resource_root}")

        if self.clean_output and self.output_root.exists():
            shutil.rmtree(self.output_root)
        self.output_root.mkdir(parents=True, exist_ok=True)

        if self.analysis_dir is not None:
            self.analysis_dir.mkdir(parents=True, exist_ok=True)

        features = load_feature_documents(self.features_root)
        if not features:
            raise SystemExit("No feature files found under features root.")

        aggregate_rows: list[dict[str, str | int]] = []
        total_generated_steps = 0

        for feature_index, feature in enumerate(features, start=1):
            plans = self._build_feature_plans(feature)
            total_generated_steps += sum(len(scenario_plan) for scenario_plan in plans)

            robot_path, resource_path = self._write_feature_outputs(feature, plans)

            if self.analysis_dir is not None:
                feature_analysis_path = self.analysis_dir / f"{Path(feature.source_file).stem}.analysis.json"
                write_feature_analysis_json(
                    feature_analysis_path,
                    feature,
                    plans,
                )

            aggregate_rows.append(
                {
                    "FEATURE_INDEX": feature_index,
                    "FEATURE_NAME": feature.feature_name,
                    "SOURCE_FILE": feature.source_file,
                    "SCENARIOS": len(feature.scenarios),
                    "GENERATED_STEPS": sum(len(item) for item in plans),
                    "ROBOT_FILE": str(robot_path),
                    "RESOURCE_FILE": str(resource_path),
                }
            )

        if self.analysis_dir is not None:
            return write_pipeline_reports(
                self.analysis_dir,
                features_root=self.features_root,
                resource_root=self.resource_root,
                output_root=self.output_root,
                catalog_size=len(self.matcher.catalog),
                features_processed=len(features),
                total_generated_steps=total_generated_steps,
                aggregate_rows=aggregate_rows,
            )

        return {
            "features_root": str(self.features_root),
            "resource_root": str(self.resource_root),
            "output_root": str(self.output_root),
            "analysis_dir": "",
            "catalog_size": len(self.matcher.catalog),
            "features_processed": len(features),
            "generated_steps": total_generated_steps,
        }

    def _build_feature_plans(
        self,
        feature: FeatureDocument,
    ) -> list[list[StepExecutionPlan]]:
        scenario_plans: list[list[StepExecutionPlan]] = []

        for scenario in feature.scenarios:
            plans: list[StepExecutionPlan] = []
            for step_index, step in enumerate(scenario.steps, start=1):
                analysis = self.matcher.analyze_step(step.text)
                mapped_keyword, mapped_arguments, confidence, source = self.matcher.map_step(analysis)
                plans.append(
                    StepExecutionPlan(
                        source_step=step,
                        generated_keyword_name=self._build_generated_keyword_name(step_index, mapped_keyword),
                        mapped_keyword_name=mapped_keyword,
                        mapped_arguments=mapped_arguments,
                        confidence=confidence,
                        match_source=source,
                        intent=analysis.intent,
                    )
                )
            scenario_plans.append(plans)

        return scenario_plans

    @staticmethod
    def _build_generated_keyword_name(step_index: int, mapped_keyword: str) -> str:
        return f"{step_index:02d}: {sanitize_keyword_title(mapped_keyword)}"

    def _write_feature_outputs(
        self,
        feature: FeatureDocument,
        scenario_plans: list[list[StepExecutionPlan]],
    ) -> tuple[Path, Path]:
        base_name = Path(feature.source_file).stem
        robot_path = self.output_root / f"{base_name}.robot"
        resource_path = self.output_root / f"{base_name}.resource"
        relative_mainlib = self._as_robot_path(Path("../Resource/MainLib.resource"))
        resource_lines = [
            "*** Settings ***",
            f"Documentation    Auto-generated executable resource for feature '{feature.feature_name}'.",
            f"Resource    {relative_mainlib}",
        ]
        resource_lines.extend(["", "*** Keywords ***"])

        for scenario_plan in scenario_plans:
            for plan in scenario_plan:
                resource_lines.append(plan.generated_keyword_name)
                resource_lines.append(
                    f"    [Documentation]    Execute source step ({plan.source_step.clause}): {plan.source_step.text}"
                )
                if plan.mapped_keyword_name == "No Operation":
                    resource_lines.append(f"    Fail    Unmapped step skipped: {plan.source_step.text}")
                else:
                    resource_lines.append("    " + "    ".join([plan.mapped_keyword_name] + plan.mapped_arguments))
                resource_lines.append("")

        robot_lines = [
            "*** Settings ***",
            f"Documentation    Auto-generated executable tests for feature '{feature.feature_name}'.",
            f"Resource    ./{resource_path.name}",
            "",
            "*** Test Cases ***",
        ]
        for scenario, plan in zip(feature.scenarios, scenario_plans):
            robot_lines.append(scenario.name)
            robot_lines.append(f"    [Documentation]    Generated from {Path(feature.source_file).name}.")
            if scenario.tags:
                robot_lines.append(f"    [Tags]    {'    '.join(scenario.tags)}")
            robot_lines.append("    [Teardown]    Close Browser Session")
            for step_plan in plan:
                robot_lines.append(f"    {step_plan.generated_keyword_name}")
            robot_lines.append("")

        resource_path.write_text("\n".join(resource_lines).rstrip() + "\n", encoding="utf-8")
        robot_path.write_text("\n".join(robot_lines).rstrip() + "\n", encoding="utf-8")
        return robot_path, resource_path

    @staticmethod
    def _as_robot_path(path: Path) -> str:
        return str(path).replace("\\", "/")


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate Robot files from Gherkin feature files.")
    parser.add_argument("--features-root", default="Features", help="Root folder containing source .feature files.")
    parser.add_argument("--resource-root", default="Resource", help="Root folder containing existing Robot resources.")
    parser.add_argument("--output-root", default="robot-tests", help="Output folder for generated .robot/.resource files.")
    parser.add_argument(
        "--analysis-dir",
        default=DEFAULT_ANALYSIS_DIR,
        help="Optional folder for analysis artifacts.",
    )
    parser.add_argument(
        "--no-clean-output",
        action="store_true",
        help="Keep existing output-root files and overwrite only generated files.",
    )
    parser.add_argument(
        "--use-quoted-text",
        dest="ignore_quoted_text",
        action="store_false",
        help="Include quoted values in semantic similarity scoring.",
    )
    parser.set_defaults(ignore_quoted_text=True)
    parser.add_argument("--embedding-dim", type=int, default=384, help="Vector dimension for the local embedding model.")
    parser.add_argument("--semantic-weight", type=float, default=0.85, help="Weight for semantic similarity.")
    parser.add_argument("--lexical-weight", type=float, default=0.15, help="Weight for lexical similarity.")
    return parser


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    pipeline = FeatureExecutionPipeline(
        features_root=Path(args.features_root),
        resource_root=Path(args.resource_root),
        output_root=Path(args.output_root),
        analysis_dir=Path(args.analysis_dir) if args.analysis_dir else None,
        clean_output=not args.no_clean_output,
        ignore_quoted_text=args.ignore_quoted_text,
        semantic_weight=args.semantic_weight,
        lexical_weight=args.lexical_weight,
        embedding_dim=args.embedding_dim,
    )
    summary = pipeline.run()

    print(f"Features processed: {summary['features_processed']}")
    print(f"Test Cases under root: {summary['output_root']}")
    if summary["analysis_dir"]:
        print(f"Gherkin Analysis under: {summary['analysis_dir']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
