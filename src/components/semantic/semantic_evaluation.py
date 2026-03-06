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
from typing import Iterable

DEFAULT_WEIGHT_PAIRS = [
    (1.0, 0.0),
    (0.85, 0.15),
    (0.70, 0.30),
]
ALLOWED_BACKENDS = {"auto", "local", "sentence-transformers"}


@dataclass
class EvaluationConfig:
    name: str
    embedding_backend: str
    semantic_weight: float
    lexical_weight: float
    sentence_model: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384


def sentence_transformers_available() -> bool:
    return importlib.util.find_spec("sentence_transformers") is not None


def normalize_backend(raw_backend: str) -> str:
    cleaned = str(raw_backend or "").strip().lower()
    if cleaned in {"sentence", "sentence-transformer", "sentence-transformers", "st"}:
        return "sentence-transformers"
    return cleaned


def parse_embedding_backends(
    raw_backends: str | None,
    include_sentence_transformers: bool,
) -> list[str]:
    if raw_backends:
        tokens = [normalize_backend(token) for token in raw_backends.split(",") if token.strip()]
    else:
        tokens = ["local"]
        if include_sentence_transformers:
            tokens.append("sentence-transformers")

    invalid = [token for token in tokens if token not in ALLOWED_BACKENDS]
    if invalid:
        raise SystemExit(f"Unsupported embedding backend(s): {', '.join(invalid)}")

    resolved: list[str] = []
    skipped: list[str] = []
    for token in tokens:
        if token == "sentence-transformers" and not include_sentence_transformers:
            skipped.append(token)
            continue
        resolved.append(token)

    if skipped:
        print("sentence-transformers not installed; skipping backends: " + ", ".join(skipped))
    if not resolved:
        raise SystemExit("No embedding backends available for evaluation.")
    return resolved


def parse_weight_pairs(raw_pairs: str | None) -> list[tuple[float, float]]:
    if not raw_pairs:
        return list(DEFAULT_WEIGHT_PAIRS)

    pairs: list[tuple[float, float]] = []
    for token in raw_pairs.split(","):
        cleaned = token.strip()
        if not cleaned:
            continue
        if "/" in cleaned:
            left, right = cleaned.split("/", 1)
        elif ":" in cleaned:
            left, right = cleaned.split(":", 1)
        else:
            raise SystemExit(f"Invalid weight pair '{cleaned}'. Use semantic/lexical (e.g. 0.85/0.15).")
        try:
            semantic_weight = float(left.strip())
            lexical_weight = float(right.strip())
        except ValueError as error:
            raise SystemExit(f"Invalid weight pair '{cleaned}': {error}") from error
        if semantic_weight < 0 or lexical_weight < 0:
            raise SystemExit("Weight pairs must be non-negative.")
        if semantic_weight == 0 and lexical_weight == 0:
            raise SystemExit("Weight pairs must include at least one non-zero value.")
        pairs.append((semantic_weight, lexical_weight))

    if not pairs:
        raise SystemExit("No valid weight pairs provided.")
    return pairs


def format_config_name(
    backend: str,
    semantic_weight: float,
    lexical_weight: float,
) -> str:
    backend_label = "sentence" if backend == "sentence-transformers" else backend
    semantic_pct = int(round(semantic_weight * 100))
    lexical_pct = int(round(lexical_weight * 100))
    return f"{backend_label}_s{semantic_pct}_l{lexical_pct}"


def build_configs(
    backends: Iterable[str],
    weight_pairs: Iterable[tuple[float, float]],
    sentence_model: str,
    embedding_dim: int,
) -> list[EvaluationConfig]:
    configs: list[EvaluationConfig] = []
    for backend in backends:
        for semantic_weight, lexical_weight in weight_pairs:
            configs.append(
                EvaluationConfig(
                    name=format_config_name(backend, semantic_weight, lexical_weight),
                    embedding_backend=backend,
                    semantic_weight=semantic_weight,
                    lexical_weight=lexical_weight,
                    sentence_model=sentence_model,
                    embedding_dim=embedding_dim,
                )
            )
    return configs


def run_mapper(
    config: EvaluationConfig,
    requirements: Path,
    resource_root: Path,
    output_dir: Path,
    top_k: int,
    strong_threshold: float,
    review_threshold: float,
    disable_nlp_preprocess: bool,
    requirement_text_field: str | None,
    requirement_id_prefix: str | None,
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
        "--embedding-dim",
        str(config.embedding_dim),
        "--semantic-weight",
        str(config.semantic_weight),
        "--lexical-weight",
        str(config.lexical_weight),
    ]
    if disable_nlp_preprocess:
        command.append("--disable-nlp-preprocess")
    if requirement_text_field:
        command.extend(["--requirement-text-field", requirement_text_field])
    if requirement_id_prefix:
        command.extend(["--requirement-id-prefix", requirement_id_prefix])

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
        "SENTENCE_MODEL",
        "EMBEDDING_DIM",
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
        "| Config | Backend | Sentence Model | Embedding Dim | Weights (S/L) | Auto | Review | No Match | Coverage | Avg Top1 | Efficiency | Status |",
        "|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---|",
    ]
    for row in rows:
        lines.append(
            "| {CONFIG} | {BACKEND} | {SENTENCE_MODEL} | {EMBEDDING_DIM} | {SEMANTIC_WEIGHT}/{LEXICAL_WEIGHT} | {AUTO} | {REVIEW} | {NO_MATCH} | {COVERAGE_RATE} | {AVG_TOP1_SCORE} | {EFFICIENCY_INDEX} | {STATUS} |".format(
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
    parser.add_argument("--top-k", type=int, default=3, help="Top-k matches.")
    parser.add_argument("--strong-threshold", type=float, default=0.45, help="AUTO threshold.")
    parser.add_argument("--review-threshold", type=float, default=0.30, help="REVIEW threshold.")
    parser.add_argument(
        "--embedding-backends",
        default=None,
        help="Comma-separated embedding backends (auto, local, sentence-transformers).",
    )
    parser.add_argument(
        "--weight-pairs",
        default=None,
        help="Comma-separated semantic/lexical weight pairs (e.g. 1/0,0.85/0.15).",
    )
    parser.add_argument(
        "--sentence-model",
        default="all-MiniLM-L6-v2",
        help="SentenceTransformer model name.",
    )
    parser.add_argument(
        "--embedding-dim",
        type=int,
        default=384,
        help="Vector dimension for the local hashing embedding model.",
    )
    parser.add_argument(
        "--requirement-text-field",
        default=None,
        help="Optional CSV/JSON field name containing requirement text.",
    )
    parser.add_argument(
        "--requirement-id-prefix",
        default="REQ",
        help="ID prefix for generated requirement IDs in free-form datasets.",
    )
    parser.add_argument(
        "--disable-nlp-preprocess",
        action="store_true",
        help="Disable NLP preprocessing for all benchmark runs.",
    )
    args = parser.parse_args()

    requirements = Path(args.requirements)
    resource_root = Path(args.resource_root)
    output_root = Path(args.output_root)

    if not requirements.exists():
        raise SystemExit(f"Requirements file not found: {requirements}")
    if not resource_root.exists():
        raise SystemExit(f"Resource root not found: {resource_root}")
    if args.top_k <= 0:
        raise SystemExit("--top-k must be a positive integer.")
    if args.review_threshold > args.strong_threshold:
        raise SystemExit("--review-threshold must be <= --strong-threshold.")
    if args.embedding_dim <= 0:
        raise SystemExit("--embedding-dim must be a positive integer.")

    include_sentence = sentence_transformers_available()
    backends = parse_embedding_backends(args.embedding_backends, include_sentence_transformers=include_sentence)
    weight_pairs = parse_weight_pairs(args.weight_pairs)
    configs = build_configs(
        backends=backends,
        weight_pairs=weight_pairs,
        sentence_model=args.sentence_model,
        embedding_dim=args.embedding_dim,
    )

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
            top_k=args.top_k,
            strong_threshold=args.strong_threshold,
            review_threshold=args.review_threshold,
            disable_nlp_preprocess=args.disable_nlp_preprocess,
            requirement_text_field=args.requirement_text_field,
            requirement_id_prefix=args.requirement_id_prefix,
        )

        mapping_report_path = run_output_dir / "mapping_report.csv"
        metrics = compute_metrics(mapping_report_path) if ok else empty_metrics()

        row = {
            "CONFIG": config.name,
            "BACKEND": config.embedding_backend,
            "SENTENCE_MODEL": config.sentence_model if config.embedding_backend != "local" else "-",
            "EMBEDDING_DIM": str(config.embedding_dim),
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
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
