#!/usr/bin/env python3
"""Build LLM-ready RAG payload from semantic mapper outputs.

This script keeps the thesis main path simple:
Requirements -> semantic_mapper -> payload builder -> LLM generation.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert semantic mapping reports into an LLM generation payload.",
    )
    parser.add_argument(
        "--mapping-report",
        required=True,
        help="Path to semantic_mapper mapping_report.csv",
    )
    parser.add_argument(
        "--keyword-catalog",
        required=True,
        help="Path to semantic_mapper keyword_catalog.csv",
    )
    parser.add_argument(
        "--output-json",
        default="Results/rag-context/llm_generation_payload.json",
        help="Output JSON payload for LLM generation.",
    )
    parser.add_argument(
        "--output-summary",
        default="Results/rag-context/summary.md",
        help="Output markdown summary path.",
    )
    parser.add_argument(
        "--review-threshold",
        type=float,
        default=0.30,
        help="Minimum score threshold to treat existing keyword reuse as available.",
    )
    parser.add_argument(
        "--strong-threshold",
        type=float,
        default=0.45,
        help="Strong confidence threshold for retrieval risk diagnostics.",
    )
    parser.add_argument(
        "--ambiguity-margin",
        type=float,
        default=0.04,
        help="Top1-Top2 margin below this value is high ambiguity risk.",
    )
    return parser.parse_args()


def parse_float(value: str, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def classify_retrieval_risk(
    top1_score: float,
    top2_score: float,
    strong_threshold: float,
    review_threshold: float,
    ambiguity_margin: float,
) -> str:
    if top1_score < review_threshold:
        return "high"
    if (top1_score - top2_score) < ambiguity_margin:
        return "high"
    if top1_score < strong_threshold:
        return "medium"
    return "low"


def detect_top_k(headers: list[str]) -> int:
    top_k = 0
    for header in headers:
        if not header.startswith("MATCH_") or not header.endswith("_KEYWORD"):
            continue
        rank_token = header.replace("MATCH_", "").replace("_KEYWORD", "")
        if rank_token.isdigit():
            top_k = max(top_k, int(rank_token))
    return top_k


def load_keyword_catalog(catalog_path: Path) -> dict[str, dict[str, str]]:
    with catalog_path.open("r", encoding="utf-8") as file_handle:
        rows = list(csv.DictReader(file_handle))
    lookup: dict[str, dict[str, str]] = {}
    for row in rows:
        keyword_name = str(row.get("KEYWORD_NAME", "")).strip()
        if not keyword_name:
            continue
        lookup[keyword_name] = row
    return lookup


def build_payload(
    mapping_rows: list[dict[str, str]],
    keyword_lookup: dict[str, dict[str, str]],
    top_k: int,
    review_threshold: float,
    strong_threshold: float,
    ambiguity_margin: float,
) -> tuple[dict, Counter[str]]:
    entries: list[dict] = []
    risk_counter: Counter[str] = Counter()

    for row in mapping_rows:
        candidates: list[dict] = []
        for rank in range(1, top_k + 1):
            keyword_name = str(row.get(f"MATCH_{rank}_KEYWORD", "")).strip()
            if not keyword_name:
                continue
            catalog_row = keyword_lookup.get(keyword_name, {})
            candidates.append(
                {
                    "keyword_name": keyword_name,
                    "module": str(row.get(f"MATCH_{rank}_MODULE", "")).strip(),
                    "source_file": str(row.get(f"MATCH_{rank}_SOURCE", "")).strip(),
                    "score": round(parse_float(row.get(f"MATCH_{rank}_SCORE", "0")), 4),
                    "semantic_score": round(parse_float(row.get(f"MATCH_{rank}_SEMANTIC", "0")), 4),
                    "lexical_score": round(parse_float(row.get(f"MATCH_{rank}_LEXICAL", "0")), 4),
                    "documentation": str(catalog_row.get("DOCUMENTATION", "")).strip(),
                    "arguments": str(catalog_row.get("ARGUMENTS", "")).strip(),
                }
            )

        top1_score = candidates[0]["score"] if candidates else 0.0
        top2_score = candidates[1]["score"] if len(candidates) > 1 else 0.0
        retrieval_risk = classify_retrieval_risk(
            top1_score=top1_score,
            top2_score=top2_score,
            strong_threshold=strong_threshold,
            review_threshold=review_threshold,
            ambiguity_margin=ambiguity_margin,
        )
        risk_counter[retrieval_risk] += 1

        existing_keyword_available = top1_score >= review_threshold
        allow_new_keyword_recommendation = not existing_keyword_available

        entries.append(
            {
                "req_id": str(row.get("REQ_ID", "")).strip(),
                "feature": str(row.get("FEATURE", "")).strip(),
                "requirement_text": str(row.get("REQUIREMENT_TEXT", "")).strip(),
                "requirement_type": str(row.get("REQUIREMENT_TYPE", "general_requirement")).strip(),
                "nlp_actions": str(row.get("NLP_ACTIONS", "")).strip(),
                "status": str(row.get("STATUS", "")).strip(),
                "retrieval_risk": retrieval_risk,
                "top1_score": round(top1_score, 4),
                "top1_top2_margin": round(top1_score - top2_score, 4),
                "allowed_keywords": [candidate["keyword_name"] for candidate in candidates],
                "keyword_context": candidates,
                "existing_keyword_available": existing_keyword_available,
                "allow_new_keyword_recommendation": allow_new_keyword_recommendation,
                "generation_rules": [
                    "Use only keyword names from `allowed_keywords` for executable steps.",
                    "Do not invent keyword names outside `allowed_keywords`.",
                    "If `allow_new_keyword_recommendation` is true and no allowed keyword fits, recommend exactly one new keyword.",
                    "Generate only executable Gherkin steps that map to existing Robot keywords.",
                ],
            }
        )

    payload = {
        "metadata": {
            "pipeline": "semantic_mapper_to_rag_payload",
            "review_threshold": review_threshold,
            "strong_threshold": strong_threshold,
            "ambiguity_margin": ambiguity_margin,
            "top_k": top_k,
            "requirements": len(entries),
        },
        "entries": entries,
    }
    return payload, risk_counter


def write_summary(
    output_path: Path,
    payload: dict,
    risk_counter: Counter[str],
) -> None:
    entries = payload.get("entries", [])
    allow_new_count = sum(1 for entry in entries if entry.get("allow_new_keyword_recommendation", False))
    lines = [
        "# LLM Payload Summary",
        "",
        f"- Requirements processed: {len(entries)}",
        f"- Top-k candidates included: {payload['metadata']['top_k']}",
        f"- Existing keyword available: {len(entries) - allow_new_count}",
        f"- New keyword recommendation allowed: {allow_new_count}",
        "",
        "## Retrieval Risk",
        f"- low: {risk_counter.get('low', 0)}",
        f"- medium: {risk_counter.get('medium', 0)}",
        f"- high: {risk_counter.get('high', 0)}",
        "",
        "## Main Path",
        "- Requirements -> semantic_mapper -> RAG payload -> LLM executable Gherkin generation.",
    ]
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()

    mapping_report_path = Path(args.mapping_report)
    keyword_catalog_path = Path(args.keyword_catalog)
    output_json_path = Path(args.output_json)
    output_summary_path = Path(args.output_summary)
    if not mapping_report_path.exists():
        raise SystemExit(f"Mapping report not found: {mapping_report_path}")
    if not keyword_catalog_path.exists():
        raise SystemExit(f"Keyword catalog not found: {keyword_catalog_path}")

    with mapping_report_path.open("r", encoding="utf-8") as file_handle:
        reader = csv.DictReader(file_handle)
        mapping_rows = list(reader)
        headers = list(reader.fieldnames or [])
    if not mapping_rows:
        raise SystemExit("Mapping report has no rows.")

    top_k = detect_top_k(headers)
    if top_k <= 0:
        raise SystemExit("Could not detect top-k columns in mapping report.")

    keyword_lookup = load_keyword_catalog(keyword_catalog_path)
    payload, risk_counter = build_payload(
        mapping_rows=mapping_rows,
        keyword_lookup=keyword_lookup,
        top_k=top_k,
        review_threshold=args.review_threshold,
        strong_threshold=args.strong_threshold,
        ambiguity_margin=args.ambiguity_margin,
    )

    output_json_path.parent.mkdir(parents=True, exist_ok=True)
    output_json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    write_summary(output_summary_path, payload, risk_counter)

    print(f"Requirements processed: {payload['metadata']['requirements']}")
    print(f"Top-k detected: {top_k}")
    print(f"Output JSON: {output_json_path}")
    print(f"Summary: {output_summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
