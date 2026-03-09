#!/usr/bin/env python3
"""Generate executable Gherkin feature files from LLM payload entries."""

from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

try:
    import certifi
except Exception:
    certifi = None


VALID_CLAUSES = {"Given", "When", "Then", "And", "But"}
JSON_BLOCK_PATTERN = re.compile(r"\{.*\}", re.DOTALL)
NON_FILE_CHAR_PATTERN = re.compile(r"[^a-z0-9]+")
DEFAULT_TIMEOUT_SECONDS = 90
DEFAULT_RETRY_COUNT = 2


@dataclass
class GenerationResult:
    req_id: str
    file_path: str
    status: str
    retrieval_risk: str
    used_keywords: list[str]
    recommended_keyword: str
    error: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate executable Gherkin feature files from LLM payload JSON.",
    )
    parser.add_argument(
        "--payload-json",
        required=True,
        help="Path to llm_generation_payload.json",
    )
    parser.add_argument(
        "--features-output-dir",
        default="Features/generated-llm",
        help="Directory where generated .feature files will be written.",
    )
    parser.add_argument(
        "--results-dir",
        default="Results/llm-generation",
        help="Directory for generation diagnostics and summaries.",
    )
    parser.add_argument(
        "--model",
        default="gemini-3-flash-preview",
        help="LLM model used for generation.",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.1,
        help="Sampling temperature.",
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=700,
        help="Maximum output tokens per requirement.",
    )
    parser.add_argument(
        "--api-base-url",
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        help="OpenAI-compatible API base URL.",
    )
    parser.add_argument(
        "--api-key-env",
        default="GOOGLE_API_KEY",
        help="Environment variable containing API key.",
    )
    parser.add_argument(
        "--ca-bundle",
        default=None,
        help="Optional CA bundle path (PEM) used for TLS verification.",
    )
    parser.add_argument(
        "--insecure-skip-tls-verify",
        action="store_true",
        help="Disable TLS verification (debug only).",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=DEFAULT_TIMEOUT_SECONDS,
        help="HTTP timeout for each LLM request.",
    )
    parser.add_argument(
        "--retry-count",
        type=int,
        default=DEFAULT_RETRY_COUNT,
        help="Retries per requirement on transient API failures.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip API calls and build deterministic baseline features from top candidate keywords.",
    )
    return parser.parse_args()


def slugify(text: str, fallback: str) -> str:
    lowered = str(text or "").strip().lower()
    slug = NON_FILE_CHAR_PATTERN.sub("_", lowered).strip("_")
    return slug or fallback


def safe_feature_name(text: str, fallback: str) -> str:
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    return cleaned if cleaned else fallback


def parse_model_json(text: str) -> dict:
    raw = str(text or "").strip()
    if not raw:
        raise ValueError("Model returned empty response.")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    match = JSON_BLOCK_PATTERN.search(raw)
    if not match:
        raise ValueError("Model response did not contain valid JSON object.")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as error:
        raise ValueError(f"Model JSON parse failed: {error}") from error


def build_system_prompt() -> str:
    return (
        "You are a strict Robot Framework Gherkin generator.\n"
        "Return ONLY JSON.\n"
        "Use only keywords from `allowed_keywords` for executable steps.\n"
        "Never invent executable keyword names outside allowed_keywords.\n"
        "If no allowed keyword can satisfy requirement and `allow_new_keyword_recommendation` is true, "
        "return empty steps and provide one recommendation.\n"
        "Prefer concrete argument values from the requirement text.\n"
        "Output schema:\n"
        "{\n"
        '  "feature_name": "string",\n'
        '  "scenario_name": "string",\n'
        '  "tags": ["generated", "requirement_type"],\n'
        '  "steps": [{"clause":"Given|When|Then|And|But","keyword":"...","args":["..."]}],\n'
        '  "new_keyword_recommendation": null | {"keyword_name":"...","reason":"..."}\n'
        "}\n"
    )


def build_user_prompt(entry: dict) -> str:
    keyword_lines = []
    for index, item in enumerate(entry.get("keyword_context", []), start=1):
        keyword_lines.append(
            f"{index}. {item.get('keyword_name', '')} | args: {item.get('arguments', '')} | "
            f"doc: {item.get('documentation', '')}"
        )
    keyword_block = "\n".join(keyword_lines)
    return (
        f"REQ_ID: {entry.get('req_id', '')}\n"
        f"Requirement Type: {entry.get('requirement_type', 'general_requirement')}\n"
        f"Requirement Text: {entry.get('requirement_text', '')}\n"
        f"Retrieval Risk: {entry.get('retrieval_risk', '')}\n"
        f"Allowed Keywords: {', '.join(entry.get('allowed_keywords', []))}\n"
        f"Allow New Keyword Recommendation: {entry.get('allow_new_keyword_recommendation', False)}\n"
        f"Keyword Context:\n{keyword_block}\n"
        "Generate executable Gherkin steps now."
    )


def call_chat_completions(
    api_base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float,
    max_tokens: int,
    timeout_seconds: int,
    ssl_context: ssl.SSLContext,
) -> tuple[str, dict]:
    url = f"{api_base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url=url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds, context=ssl_context) as response:
        response_body = response.read().decode("utf-8")
    parsed_response = json.loads(response_body)
    choices = parsed_response.get("choices", [])
    if not choices:
        raise ValueError("LLM response missing choices.")
    message = choices[0].get("message", {})
    content = message.get("content")
    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, dict):
                text = part.get("text")
                if isinstance(text, str):
                    text_parts.append(text)
        content_text = "\n".join(text_parts).strip()
    else:
        content_text = str(content or "").strip()
    if not content_text:
        raise ValueError("LLM response content is empty.")
    return content_text, parsed_response


def parse_argument_names(arguments_text: str) -> list[str]:
    tokens = [token.strip() for token in re.split(r"\s{2,}", str(arguments_text or "").strip()) if token.strip()]
    names: list[str] = []
    for token in tokens:
        cleaned = token.split("=", 1)[0].strip()
        cleaned = cleaned.replace("${", "").replace("}", "").strip()
        if cleaned:
            names.append(cleaned)
    return names


def build_ssl_context(ca_bundle: str | None, insecure_skip_tls_verify: bool) -> ssl.SSLContext:
    if insecure_skip_tls_verify:
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context

    if ca_bundle:
        ca_path = Path(ca_bundle)
        if not ca_path.exists():
            raise SystemExit(f"CA bundle not found: {ca_path}")
        return ssl.create_default_context(cafile=str(ca_path))

    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())

    return ssl.create_default_context()


def deterministic_fallback(entry: dict) -> dict:
    keyword_context = entry.get("keyword_context", [])
    if not keyword_context:
        recommendation = {
            "keyword_name": "New Keyword Needed",
            "reason": "No retrieved keyword context available for this requirement.",
        }
        return {
            "feature_name": f"Requirement {entry.get('req_id', '')}",
            "scenario_name": f"Scenario {entry.get('req_id', '')}",
            "tags": ["generated", str(entry.get("requirement_type", "general_requirement"))],
            "steps": [],
            "new_keyword_recommendation": recommendation,
        }

    top_keyword = keyword_context[0]
    arg_names = parse_argument_names(top_keyword.get("arguments", ""))
    args = [f"<{name.lower()}>" for name in arg_names]
    return {
        "feature_name": safe_feature_name(
            f"Generated Feature {entry.get('req_id', '')}",
            fallback=f"Generated Feature {entry.get('req_id', '')}",
        ),
        "scenario_name": safe_feature_name(
            f"Generated Scenario {entry.get('req_id', '')}",
            fallback=f"Generated Scenario {entry.get('req_id', '')}",
        ),
        "tags": ["generated", str(entry.get("requirement_type", "general_requirement"))],
        "steps": [
            {
                "clause": "Given",
                "keyword": top_keyword.get("keyword_name", ""),
                "args": args,
            }
        ],
        "new_keyword_recommendation": None,
    }


def normalize_generated_payload(generated: dict, entry: dict) -> dict:
    feature_name = safe_feature_name(
        generated.get("feature_name", f"Requirement {entry.get('req_id', '')}"),
        fallback=f"Requirement {entry.get('req_id', '')}",
    )
    scenario_name = safe_feature_name(
        generated.get("scenario_name", f"Scenario {entry.get('req_id', '')}"),
        fallback=f"Scenario {entry.get('req_id', '')}",
    )
    raw_tags = generated.get("tags", ["generated", entry.get("requirement_type", "general_requirement")])
    tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]
    if "generated" not in tags:
        tags.insert(0, "generated")

    allowed_keywords = {str(item).strip() for item in entry.get("allowed_keywords", [])}
    normalized_steps: list[dict] = []
    for raw_step in generated.get("steps", []):
        if not isinstance(raw_step, dict):
            continue
        clause = str(raw_step.get("clause", "")).strip().title()
        keyword = str(raw_step.get("keyword", "")).strip()
        args = raw_step.get("args", [])
        if clause not in VALID_CLAUSES:
            raise ValueError(f"Invalid Gherkin clause: {clause}")
        if not keyword:
            raise ValueError("Step keyword is empty.")
        if keyword not in allowed_keywords:
            raise ValueError(f"Hallucinated keyword detected: {keyword}")
        if not isinstance(args, list):
            raise ValueError("Step args must be a list.")
        normalized_steps.append(
            {
                "clause": clause,
                "keyword": keyword,
                "args": [str(value) for value in args],
            }
        )

    recommendation = generated.get("new_keyword_recommendation")
    if recommendation is not None and not isinstance(recommendation, dict):
        raise ValueError("new_keyword_recommendation must be object or null.")
    if recommendation is not None:
        recommendation = {
            "keyword_name": str(recommendation.get("keyword_name", "")).strip(),
            "reason": str(recommendation.get("reason", "")).strip(),
        }
        if not recommendation["keyword_name"]:
            raise ValueError("new_keyword_recommendation.keyword_name is required.")

    if normalized_steps and recommendation is not None:
        # Keep generation deterministic: executable steps take precedence.
        recommendation = None

    if not normalized_steps and recommendation is None and entry.get("allow_new_keyword_recommendation", False):
        raise ValueError("No executable steps generated and no new keyword recommendation provided.")

    return {
        "feature_name": feature_name,
        "scenario_name": scenario_name,
        "tags": tags,
        "steps": normalized_steps,
        "new_keyword_recommendation": recommendation,
    }


def render_feature_file(req_id: str, normalized: dict) -> str:
    lines: list[str] = []
    lines.append(f"Feature: {normalized['feature_name']}")
    lines.append("")
    tags = normalized.get("tags", [])
    if tags:
        lines.append("    @" + " @".join(tags))
    lines.append(f"    Scenario: {normalized['scenario_name']} ({req_id})")
    for step in normalized.get("steps", []):
        args = step.get("args", [])
        arg_suffix = ""
        if args:
            arg_suffix = " | " + " | ".join(args)
        lines.append(f"        {step['clause']} {step['keyword']}{arg_suffix}")

    recommendation = normalized.get("new_keyword_recommendation")
    if recommendation is not None:
        lines.append(
            f"        Then Recommend New Keyword: {recommendation.get('keyword_name', '')}"
        )

    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    args = parse_args()

    payload_path = Path(args.payload_json)
    features_output_dir = Path(args.features_output_dir)
    results_dir = Path(args.results_dir)
    if not payload_path.exists():
        raise SystemExit(f"Payload file not found: {payload_path}")

    payload = json.loads(payload_path.read_text(encoding="utf-8"))
    entries = payload.get("entries", [])
    if not isinstance(entries, list) or not entries:
        raise SystemExit("Payload contains no entries.")

    api_key = os.getenv(args.api_key_env, "").strip()
    if not args.dry_run and not api_key:
        raise SystemExit(f"Environment variable {args.api_key_env} is required unless --dry-run is used.")

    features_output_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)
    ssl_context = build_ssl_context(
        ca_bundle=args.ca_bundle,
        insecure_skip_tls_verify=args.insecure_skip_tls_verify,
    )

    system_prompt = build_system_prompt()
    generation_results: list[GenerationResult] = []
    raw_log_entries: list[dict] = []
    failed = 0

    for entry in entries:
        req_id = str(entry.get("req_id", "")).strip() or "REQ_UNKNOWN"
        req_slug = slugify(req_id, fallback="req_unknown")
        retrieval_risk = str(entry.get("retrieval_risk", "unknown"))

        generated_payload = None
        raw_text = ""
        raw_response = {}
        error_message = ""

        if args.dry_run:
            generated_payload = deterministic_fallback(entry)
        else:
            user_prompt = build_user_prompt(entry)
            retry = 0
            while retry <= args.retry_count:
                try:
                    raw_text, raw_response = call_chat_completions(
                        api_base_url=args.api_base_url,
                        api_key=api_key,
                        model=args.model,
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        timeout_seconds=args.timeout_seconds,
                        ssl_context=ssl_context,
                    )
                    generated_payload = parse_model_json(raw_text)
                    break
                except urllib.error.HTTPError as error:
                    body = error.read().decode("utf-8", errors="ignore")
                    error_message = f"HTTP {error.code}: {body}"
                    if error.code in {429, 500, 502, 503, 504} and retry < args.retry_count:
                        time.sleep(1.5 * (retry + 1))
                        retry += 1
                        continue
                    break
                except urllib.error.URLError as error:
                    error_message = f"Network error: {error}"
                    if retry < args.retry_count:
                        time.sleep(1.5 * (retry + 1))
                        retry += 1
                        continue
                    break
                except Exception as error:
                    error_message = str(error)
                    break

        if generated_payload is None:
            failed += 1
            generation_results.append(
                GenerationResult(
                    req_id=req_id,
                    file_path="",
                    status="FAILED",
                    retrieval_risk=retrieval_risk,
                    used_keywords=[],
                    recommended_keyword="",
                    error=error_message or "Generation failed",
                )
            )
            raw_log_entries.append(
                {
                    "req_id": req_id,
                    "status": "FAILED",
                    "error": error_message or "Generation failed",
                    "raw_response_text": raw_text,
                    "raw_response": raw_response,
                }
            )
            continue

        try:
            normalized = normalize_generated_payload(generated_payload, entry)
            file_name = f"{req_slug}_{slugify(normalized['scenario_name'], fallback='scenario')}.feature"
            file_path = features_output_dir / file_name
            file_content = render_feature_file(req_id=req_id, normalized=normalized)
            file_path.write_text(file_content, encoding="utf-8")

            recommendation = normalized.get("new_keyword_recommendation") or {}
            generation_results.append(
                GenerationResult(
                    req_id=req_id,
                    file_path=str(file_path),
                    status="OK",
                    retrieval_risk=retrieval_risk,
                    used_keywords=[step["keyword"] for step in normalized.get("steps", [])],
                    recommended_keyword=str(recommendation.get("keyword_name", "")),
                    error="",
                )
            )
            raw_log_entries.append(
                {
                    "req_id": req_id,
                    "status": "OK",
                    "generated": normalized,
                    "raw_response_text": raw_text,
                    "raw_response": raw_response,
                }
            )
        except Exception as error:
            failed += 1
            generation_results.append(
                GenerationResult(
                    req_id=req_id,
                    file_path="",
                    status="FAILED",
                    retrieval_risk=retrieval_risk,
                    used_keywords=[],
                    recommended_keyword="",
                    error=str(error),
                )
            )
            raw_log_entries.append(
                {
                    "req_id": req_id,
                    "status": "FAILED",
                    "error": str(error),
                    "raw_generated_payload": generated_payload,
                    "raw_response_text": raw_text,
                    "raw_response": raw_response,
                }
            )

    results_json_path = results_dir / "generation_results.json"
    summary_md_path = results_dir / "summary.md"
    raw_log_path = results_dir / "raw_responses.json"

    results_json_path.write_text(
        json.dumps([result.__dict__ for result in generation_results], indent=2),
        encoding="utf-8",
    )
    raw_log_path.write_text(json.dumps(raw_log_entries, indent=2), encoding="utf-8")

    success_count = len(generation_results) - failed
    low_risk_count = sum(1 for item in generation_results if item.retrieval_risk == "low")
    high_risk_count = sum(1 for item in generation_results if item.retrieval_risk == "high")
    lines = [
        "# LLM Gherkin Generation Summary",
        "",
        f"- Payload entries: {len(entries)}",
        f"- Success: {success_count}",
        f"- Failed: {failed}",
        f"- Retrieval risk low: {low_risk_count}",
        f"- Retrieval risk high: {high_risk_count}",
        f"- Dry run: {args.dry_run}",
        f"- Model: {args.model}",
        "",
        "## Files",
        f"- Features output: {features_output_dir}",
        f"- Results JSON: {results_json_path}",
        f"- Raw responses: {raw_log_path}",
    ]
    summary_md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Entries processed: {len(entries)}")
    print(f"Success: {success_count}")
    print(f"Failed: {failed}")
    print(f"Features output: {features_output_dir}")
    print(f"Generation summary: {summary_md_path}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
