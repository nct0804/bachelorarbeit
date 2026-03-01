#!/usr/bin/env python3
"""Benchmark semantic mapper configurations and export thesis-friendly metrics."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class EvaluationConfig:
    name: str
    embedding_backend: str
    semantic_weight: float
    lexical_weight: float
    sentence_model: str = "all-MiniLM-L6-v2"


def sentence_transformers_available() -> bool:
    return importlib.util.find_spec("sentence_transformers") is not None


def build_default_configs(include_sentence_transformers: bool) -> list[EvaluationConfig]:
    configs = [
        EvaluationConfig(
            name="local_semantic_only",
            embedding_backend="local",
            semantic_weight=1.0,
            lexical_weight=0.0,
        ),
        EvaluationConfig(
            name="local_hybrid_85_15",
            embedding_backend="local",
            semantic_weight=0.85,
            lexical_weight=0.15,
        ),
        EvaluationConfig(
            name="local_hybrid_70_30",
            embedding_backend="local",
            semantic_weight=0.70,
            lexical_weight=0.30,
        ),
    ]
    if include_sentence_transformers:
        configs.extend(
            [
                EvaluationConfig(
                    name="sentence_semantic_only",
                    embedding_backend="sentence-transformers",
                    semantic_weight=1.0,
                    lexical_weight=0.0,
                ),
                EvaluationConfig(
                    name="sentence_hybrid_85_15",
                    embedding_backend="sentence-transformers",
                    semantic_weight=0.85,
                    lexical_weight=0.15,
                ),
                EvaluationConfig(
                    name="sentence_hybrid_70_30",
                    embedding_backend="sentence-transformers",
                    semantic_weight=0.70,
                    lexical_weight=0.30,
                ),
            ]
        )
    return configs


def run_mapper(
    config: EvaluationConfig,
    requirements: Path,
    resource_root: Path,
    output_dir: Path,
    phrase_map_file: Path | None,
    top_k: int,
    strong_threshold: float,
    review_threshold: float,
    disable_nlp_preprocess: bool,
) -> tuple[bool, str]:
    mapper_path = Path(__file__).with_name("semantic_mapper.py")
    command = [
        sys.executable,
        str(mapper_path),
        "--requirements",
        str(requirements),
        "--resource-root",
        str(resource_root),
        "--output-dir",
        str(output_dir),
        "--top-k",
        str(top_k),
        "--strong-threshold",
        str(strong_threshold),
        "--review-threshold",
        str(review_threshold),
        "--embedding-backend",
        config.embedding_backend,
        "--sentence-model",
        config.sentence_model,
        "--semantic-weight",
        str(config.semantic_weight),
        "--lexical-weight",
        str(config.lexical_weight),
    ]
    if phrase_map_file:
        command.extend(["--phrase-map-file", str(phrase_map_file)])
    if disable_nlp_preprocess:
        command.append("--disable-nlp-preprocess")

    result = subprocess.run(command, capture_output=True, text=True, check=False)
    output = "\n".join([result.stdout.strip(), result.stderr.strip()]).strip()
    return result.returncode == 0, output


def compute_metrics(mapping_report_path: Path) -> dict[str, float | int]:
    if not mapping_report_path.exists():
        return {
            "total": 0,
            "auto": 0,
            "review": 0,
            "no_match": 0,
            "auto_rate": 0.0,
            "coverage_rate": 0.0,
            "avg_top1_score": 0.0,
            "avg_top1_semantic": 0.0,
            "avg_top1_lexical": 0.0,
            "efficiency_index": 0.0,
        }

    with mapping_report_path.open("r", encoding="utf-8") as file_handle:
        rows = list(csv.DictReader(file_handle))

    total = len(rows)
    auto = sum(1 for row in rows if row.get("STATUS") == "AUTO_SUGGEST")
    review = sum(1 for row in rows if row.get("STATUS") == "NEEDS_REVIEW")
    no_match = sum(1 for row in rows if row.get("STATUS") == "NO_MATCH")

    def average_float(field_name: str) -> float:
        values: list[float] = []
        for row in rows:
            try:
                values.append(float(row.get(field_name, "0") or 0))
            except ValueError:
                continue
        if not values:
            return 0.0
        return sum(values) / len(values)

    auto_rate = auto / total if total else 0.0
    coverage_rate = (total - no_match) / total if total else 0.0
    avg_top1_score = average_float("MATCH_1_SCORE")
    avg_top1_semantic = average_float("MATCH_1_SEMANTIC")
    avg_top1_lexical = average_float("MATCH_1_LEXICAL")
    # Weighted metric: auto full credit, review half credit.
    efficiency_index = ((auto + (0.5 * review)) / total) if total else 0.0

    return {
        "total": total,
        "auto": auto,
        "review": review,
        "no_match": no_match,
        "auto_rate": auto_rate,
        "coverage_rate": coverage_rate,
        "avg_top1_score": avg_top1_score,
        "avg_top1_semantic": avg_top1_semantic,
        "avg_top1_lexical": avg_top1_lexical,
        "efficiency_index": efficiency_index,
    }


def empty_metrics() -> dict[str, float | int]:
    return {
        "total": 0,
        "auto": 0,
        "review": 0,
        "no_match": 0,
        "auto_rate": 0.0,
        "coverage_rate": 0.0,
        "avg_top1_score": 0.0,
        "avg_top1_semantic": 0.0,
        "avg_top1_lexical": 0.0,
        "efficiency_index": 0.0,
    }


def write_metrics_csv(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    headers = [
        "CONFIG",
        "BACKEND",
        "SEMANTIC_WEIGHT",
        "LEXICAL_WEIGHT",
        "TOTAL_REQ",
        "AUTO",
        "REVIEW",
        "NO_MATCH",
        "AUTO_RATE",
        "COVERAGE_RATE",
        "AVG_TOP1_SCORE",
        "AVG_TOP1_SEMANTIC",
        "AVG_TOP1_LEXICAL",
        "EFFICIENCY_INDEX",
        "STATUS",
        "OUTPUT_DIR",
        "NOTES",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=headers)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_metrics_markdown(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Semantic Mapper Benchmark",
        "",
        "| Config | Backend | Weights (S/L) | Auto | Review | No Match | Coverage | Avg Top1 | Efficiency | Status |",
        "|---|---|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for row in rows:
        lines.append(
            "| {CONFIG} | {BACKEND} | {SEMANTIC_WEIGHT}/{LEXICAL_WEIGHT} | {AUTO} | {REVIEW} | {NO_MATCH} | {COVERAGE_RATE} | {AVG_TOP1_SCORE} | {EFFICIENCY_INDEX} | {STATUS} |".format(
                **row
            )
        )
    lines.append("")
    lines.append("## Notes")
    lines.append("- Coverage = (AUTO + REVIEW) / TOTAL_REQ.")
    lines.append("- Efficiency index = (AUTO + 0.5 * REVIEW) / TOTAL_REQ.")
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run benchmark for semantic mapper configurations.")
    parser.add_argument("--requirements", required=True, help="Path to requirements file.")
    parser.add_argument("--resource-root", default="Resource", help="Robot resource root.")
    parser.add_argument(
        "--output-root",
        default="Results/semantic-evaluation",
        help="Output root folder for benchmark artifacts.",
    )
    parser.add_argument(
        "--phrase-map-file",
        default=None,
        help="Optional phrase map JSON path.",
    )
    parser.add_argument("--top-k", type=int, default=3, help="Top-k matches.")
    parser.add_argument("--strong-threshold", type=float, default=0.45, help="AUTO threshold.")
    parser.add_argument("--review-threshold", type=float, default=0.30, help="REVIEW threshold.")
    parser.add_argument(
        "--disable-nlp-preprocess",
        action="store_true",
        help="Disable NLP preprocessing for all benchmark runs.",
    )
    args = parser.parse_args()

    requirements = Path(args.requirements)
    resource_root = Path(args.resource_root)
    output_root = Path(args.output_root)
    phrase_map_file = Path(args.phrase_map_file) if args.phrase_map_file else None

    if not requirements.exists():
        raise SystemExit(f"Requirements file not found: {requirements}")
    if not resource_root.exists():
        raise SystemExit(f"Resource root not found: {resource_root}")
    if phrase_map_file and not phrase_map_file.exists():
        raise SystemExit(f"Phrase map file not found: {phrase_map_file}")

    include_sentence = sentence_transformers_available()
    configs = build_default_configs(include_sentence_transformers=include_sentence)

    rows: list[dict[str, str]] = []
    run_root = output_root / "runs"
    run_root.mkdir(parents=True, exist_ok=True)

    for config in configs:
        run_output_dir = run_root / config.name
        # Ensure each config run is isolated and cannot reuse stale outputs.
        if run_output_dir.exists():
            shutil.rmtree(run_output_dir)
        run_output_dir.mkdir(parents=True, exist_ok=True)

        ok, log_output = run_mapper(
            config=config,
            requirements=requirements,
            resource_root=resource_root,
            output_dir=run_output_dir,
            phrase_map_file=phrase_map_file,
            top_k=args.top_k,
            strong_threshold=args.strong_threshold,
            review_threshold=args.review_threshold,
            disable_nlp_preprocess=args.disable_nlp_preprocess,
        )

        mapping_report_path = run_output_dir / "mapping_report.csv"
        metrics = compute_metrics(mapping_report_path) if ok else empty_metrics()

        row = {
            "CONFIG": config.name,
            "BACKEND": config.embedding_backend,
            "SEMANTIC_WEIGHT": f"{config.semantic_weight:.2f}",
            "LEXICAL_WEIGHT": f"{config.lexical_weight:.2f}",
            "TOTAL_REQ": str(metrics["total"]),
            "AUTO": str(metrics["auto"]),
            "REVIEW": str(metrics["review"]),
            "NO_MATCH": str(metrics["no_match"]),
            "AUTO_RATE": f"{metrics['auto_rate']:.4f}",
            "COVERAGE_RATE": f"{metrics['coverage_rate']:.4f}",
            "AVG_TOP1_SCORE": f"{metrics['avg_top1_score']:.4f}",
            "AVG_TOP1_SEMANTIC": f"{metrics['avg_top1_semantic']:.4f}",
            "AVG_TOP1_LEXICAL": f"{metrics['avg_top1_lexical']:.4f}",
            "EFFICIENCY_INDEX": f"{metrics['efficiency_index']:.4f}",
            "STATUS": "SUCCESS" if ok else "FAILED",
            "OUTPUT_DIR": str(run_output_dir),
            "NOTES": log_output[:1000],
        }
        rows.append(row)

        print(
            f"[{row['STATUS']}] {row['CONFIG']} | coverage={row['COVERAGE_RATE']} | "
            f"auto={row['AUTO']} review={row['REVIEW']} no_match={row['NO_MATCH']}"
        )

    metrics_csv = output_root / "metrics.csv"
    metrics_md = output_root / "metrics.md"
    metrics_json = output_root / "metrics.json"

    write_metrics_csv(rows, metrics_csv)
    write_metrics_markdown(rows, metrics_md)
    metrics_json.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"Metrics CSV: {metrics_csv}")
    print(f"Metrics Markdown: {metrics_md}")
    print(f"Metrics JSON: {metrics_json}")
    if not include_sentence:
        print("sentence-transformers not installed; sentence backend configs were skipped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
