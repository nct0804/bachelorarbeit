from __future__ import annotations

import argparse
import json
import shutil
import sys
from dataclasses import asdict
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from src.components.semantic import semantic_mapper
from src.components.semantic.nlp_processor import RequirementNLPProcessor
from src.components.rag.context.context_builder import ContextBuilder, ContextConfig
from src.components.rag.examples.example_loader import load_example_pairs, select_relevant_examples
from src.components.rag.generation.prompt_builder import PromptBuilder, PromptConfig
from src.components.rag.generation.robot_generator import GeneratorConfig, RobotTestGenerator
from src.components.rag.llm.gemini_client import GeminiClient
from src.components.rag.models import RagRequirement
from src.components.rag.retrieval.hybrid_retriever import HybridRetriever, RetrievalConfig


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Modular RAG pipeline for requirement-based Robot Framework generation.",
    )
    parser.add_argument("--requirements", required=True, help="Requirement dataset path.")
    parser.add_argument(
        "--requirement-text-field",
        default=None,
        help="Optional CSV/JSON field name that contains requirement text.",
    )
    parser.add_argument(
        "--requirement-id-prefix",
        default="REQ",
        help="ID prefix used for generated requirement IDs in free-form input.",
    )
    parser.add_argument("--resource-root", default="Resource", help="Robot resource root directory.")
    parser.add_argument("--features-root", default="Features", help="Feature examples root directory.")
    parser.add_argument("--robot-tests-root", default="robot-tests", help="Robot tests examples root.")
    parser.add_argument("--output-dir", default="Results/rag-generation", help="Output directory.")
    parser.add_argument(
        "--keyword-scope",
        default="all",
        choices=["all", "common", "modules"],
        help="Keyword scope for retrieval.",
    )
    parser.add_argument("--top-k", type=int, default=5, help="Top K keywords for retrieval.")
    parser.add_argument("--max-steps", type=int, default=1, help="Max steps generated per requirement.")
    parser.add_argument(
        "--semantic-weight",
        type=float,
        default=0.85,
        help="Weight for embedding similarity.",
    )
    parser.add_argument(
        "--lexical-weight",
        type=float,
        default=0.15,
        help="Weight for lexical similarity.",
    )
    parser.add_argument(
        "--embedding-backend",
        default="auto",
        choices=["auto", "local", "sentence-transformers"],
        help="Embedding backend.",
    )
    parser.add_argument("--sentence-model", default="all-MiniLM-L6-v2", help="Sentence model.")
    parser.add_argument("--embedding-dim", type=int, default=384, help="Embedding dimension.")
    parser.add_argument(
        "--ignore-quoted-text",
        action="store_true",
        help="Ignore quoted values in similarity scoring.",
    )
    parser.add_argument(
        "--use-quoted-text",
        dest="ignore_quoted_text",
        action="store_false",
        help="Include quoted values in similarity scoring.",
    )
    parser.set_defaults(ignore_quoted_text=True)
    parser.add_argument(
        "--few-shot",
        type=int,
        default=2,
        help="Number of few-shot examples to include.",
    )
    parser.add_argument(
        "--llm-backend",
        default="gemini",
        choices=["template", "gemini", "file"],
        help="LLM backend: template (no API), gemini (live), file (pre-generated).",
    )
    parser.add_argument(
        "--gemini-model",
        default="gemini-2.5-flash",
        help="Gemini model name.",
    )
    parser.add_argument(
        "--gemini-temperature",
        type=float,
        default=0.2,
        help="Gemini temperature.",
    )
    parser.add_argument(
        "--gemini-max-tokens",
        type=int,
        default=1200,
        help="Gemini max output tokens.",
    )
    parser.add_argument(
        "--gemini-timeout",
        type=int,
        default=90,
        help="Gemini timeout in seconds.",
    )
    parser.add_argument(
        "--clean-output",
        action="store_true",
        help="Clean output directory before generation.",
    )
    parser.add_argument(
        "--llm-output-dir",
        default=None,
        help="Directory containing LLM outputs named <REQ_ID>_<FEATURE>.output.txt (file backend).",
    )
    parser.add_argument(
        "--env-file",
        default=".env",
        help="Optional path to .env file for Gemini credentials.",
    )
    return parser


def build_rag_requirement(
    entry: semantic_mapper.RequirementEntry,
    nlp_processor: RequirementNLPProcessor,
) -> RagRequirement:
    processed = nlp_processor.preprocess_requirement_text(entry.requirement_text)
    return RagRequirement(
        req_id=entry.req_id,
        feature=entry.feature,
        requirement_text=entry.requirement_text,
        mapping_text=processed.mapping_text or entry.requirement_text,
        requirement_type=processed.requirement_type,
        nlp_actions=[action.action_text for action in processed.actions],
    )


def sanitize_filename(text: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in text)
    cleaned = "_".join(filter(None, cleaned.split("_")))
    return cleaned or "requirement"


def main() -> int:
    parser = build_argument_parser()
    args = parser.parse_args()

    requirements_path = Path(args.requirements)
    resource_root = Path(args.resource_root)
    features_root = Path(args.features_root)
    robot_tests_root = Path(args.robot_tests_root)
    output_dir = Path(args.output_dir)

    if not requirements_path.exists():
        raise SystemExit(f"Requirement dataset not found: {requirements_path}")
    if not resource_root.exists():
        raise SystemExit(f"Resource root not found: {resource_root}")

    if args.clean_output and output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    prompt_dir = output_dir / "prompts"
    robot_dir = output_dir / "robot"
    resource_dir = output_dir / "resource"
    context_dir = output_dir / "context"
    llm_dir = output_dir / "llm_responses"
    for directory in [prompt_dir, robot_dir, resource_dir, context_dir, llm_dir]:
        directory.mkdir(parents=True, exist_ok=True)

    nlp_processor = RequirementNLPProcessor(ignore_quoted_text=args.ignore_quoted_text)

    requirements = semantic_mapper.load_requirements(
        requirement_path=requirements_path,
        requirement_text_field=args.requirement_text_field,
        requirement_id_prefix=args.requirement_id_prefix,
    )
    if not requirements:
        raise SystemExit("No requirements found in the dataset.")

    retriever_config = RetrievalConfig(
        top_k=args.top_k,
        semantic_weight=args.semantic_weight,
        lexical_weight=args.lexical_weight,
        embedding_backend=args.embedding_backend,
        sentence_model=args.sentence_model,
        embedding_dim=args.embedding_dim,
        keyword_scope=args.keyword_scope,
    )
    retriever = HybridRetriever(retriever_config)
    retriever.load_catalog(resource_root)
    retriever.prepare_index()

    examples = load_example_pairs(features_root, robot_tests_root)

    context_builder = ContextBuilder(ContextConfig(max_keywords=args.top_k, max_examples=args.few_shot))
    prompt_builder = PromptBuilder(context_builder, PromptConfig())
    generator = RobotTestGenerator(GeneratorConfig(max_steps=args.max_steps))

    summary_rows: list[dict] = []

    llm_backend = args.llm_backend
    llm_output_dir = Path(args.llm_output_dir) if args.llm_output_dir else None
    gemini_client = None
    if llm_backend == "gemini":
        env_path = Path(args.env_file) if args.env_file else None
        config = GeminiClient.from_env(args.gemini_model, env_file=env_path)
        config.timeout_seconds = args.gemini_timeout
        gemini_client = GeminiClient(config)
    elif llm_backend == "file":
        if llm_output_dir is None:
            raise SystemExit("--llm-output-dir is required when --llm-backend=file.")

    for entry in requirements:
        rag_requirement = build_rag_requirement(entry, nlp_processor)
        retrieved_keywords = retriever.retrieve(
            requirement_text=rag_requirement.requirement_text,
            mapping_text=rag_requirement.mapping_text,
            ignore_quoted_text=args.ignore_quoted_text,
            top_k=args.top_k,
        )
        relevant_examples = select_relevant_examples(
            rag_requirement.requirement_text,
            examples,
            args.few_shot,
        )
        context = context_builder.build(rag_requirement, retrieved_keywords, relevant_examples)
        prompt = prompt_builder.build_prompt(context)

        base_name = sanitize_filename(f"{rag_requirement.req_id}_{rag_requirement.feature}")
        resource_name = f"{base_name}_rag"

        llm_output = None
        if llm_backend == "file" and llm_output_dir is not None:
            candidate_path = llm_output_dir / f"{base_name}.output.txt"
            if not candidate_path.exists():
                raise SystemExit(f"LLM output not found: {candidate_path}")
            llm_output = candidate_path.read_text(encoding="utf-8")
        elif llm_backend == "gemini" and gemini_client is not None:
            llm_output = gemini_client.generate_content(
                prompt=prompt,
                temperature=args.gemini_temperature,
                max_output_tokens=args.gemini_max_tokens,
            )
            llm_response_path = llm_dir / f"{base_name}.output.txt"
            llm_response_path.write_text(llm_output, encoding="utf-8")

        result = generator.generate(
            requirement=rag_requirement,
            retrieved_keywords=retrieved_keywords,
            prompt=prompt,
            resource_name=resource_name,
            llm_output=llm_output,
        )

        prompt_path = prompt_dir / f"{base_name}.prompt.txt"
        prompt_path.write_text(prompt, encoding="utf-8")

        robot_path = robot_dir / f"{base_name}.robot"
        robot_path.write_text(result.robot_content, encoding="utf-8")

        resource_path = resource_dir / f"{base_name}.resource"
        resource_path.write_text(result.resource_content, encoding="utf-8")

        context_payload = {
            "requirement": asdict(rag_requirement),
            "retrieved_keywords": [asdict(keyword) for keyword in retrieved_keywords],
            "examples": [asdict(example) for example in relevant_examples],
        }
        context_path = context_dir / f"{base_name}.context.json"
        context_path.write_text(json.dumps(context_payload, indent=2), encoding="utf-8")

        summary_rows.append(
            {
                "REQ_ID": rag_requirement.req_id,
                "FEATURE": rag_requirement.feature,
                "REQUIREMENT_TEXT": rag_requirement.requirement_text,
                "REQUIREMENT_TYPE": rag_requirement.requirement_type,
                "TOP_KEYWORD": retrieved_keywords[0].keyword_name if retrieved_keywords else "",
                "TOP_SCORE": f"{retrieved_keywords[0].final_score:.4f}" if retrieved_keywords else "0.0000",
                "ROBOT_FILE": str(robot_path),
                "RESOURCE_FILE": str(resource_path),
                "PROMPT_FILE": str(prompt_path),
            }
        )

    summary_path = output_dir / "rag_summary.json"
    summary_payload = {
        "requirements_processed": len(requirements),
        "keyword_scope": args.keyword_scope,
        "top_k": args.top_k,
        "embedding_backend": retriever.embedding_backend_name,
        "semantic_weight": retriever.semantic_weight,
        "lexical_weight": retriever.lexical_weight,
        "llm_backend": llm_backend,
        "llm_model": args.gemini_model if llm_backend == "gemini" else "",
        "output_dir": str(output_dir),
        "artifacts": summary_rows,
    }
    summary_path.write_text(json.dumps(summary_payload, indent=2), encoding="utf-8")

    print(f"Requirements processed: {len(requirements)}")
    print(f"Output directory: {output_dir}")
    print(f"Summary: {summary_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
