from __future__ import annotations

from dataclasses import dataclass

from src.components.rag.context.context_builder import ContextBuilder
from src.components.rag.models import RagContext


DEFAULT_CONSTRAINTS = [
    "Use only the retrieved keywords listed below. Do not invent new keywords.",
    "Generate Robot Framework files that are syntactically valid.",
    "Use Title Case for keyword names and 4 spaces for indentation.",
    "Every keyword in the resource file must include a [Documentation] setting.",
    "Import '../../Resource/MainLib.resource' in the resource file.",
    "Do not include locators or selectors; rely on existing keywords only.",
    "If you need data values, use the provided quoted values or define variables in *** Variables ***.",
]


@dataclass
class PromptConfig:
    """Configuration for prompt assembly."""

    include_examples: bool = True
    include_scores: bool = True


class PromptBuilder:
    """Build constrained prompts for LLM-backed generation."""

    def __init__(self, context_builder: ContextBuilder, config: PromptConfig) -> None:
        self.context_builder = context_builder
        self.config = config

    def build_prompt(self, context: RagContext) -> str:
        requirement = context.requirement
        keyword_lines: list[str] = []
        for index, keyword in enumerate(context.retrieved_keywords, start=1):
            args = keyword.arguments.strip() if keyword.arguments else ""
            doc = keyword.documentation.strip() if keyword.documentation else ""
            score = f"score={keyword.final_score:.4f}" if self.config.include_scores else ""
            line = (
                f"{index}. {keyword.keyword_name} | module={keyword.module} | args={args} | "
                f"doc={doc} {score}".strip()
            )
            keyword_lines.append(line)

        examples_block = ""
        if self.config.include_examples:
            examples_block = self.context_builder.format_examples(context.examples)

        constraints = "\n".join(f"- {item}" for item in DEFAULT_CONSTRAINTS)
        keywords_section = "\n".join(keyword_lines) if keyword_lines else "None"

        prompt = [
            "You are an expert Robot Framework test generator.",
            "Produce executable Robot Framework tests grounded in the retrieved keywords.",
            "",
            "Constraints:",
            constraints,
            "",
            "Requirement:",
            requirement.requirement_text,
            "",
            f"Requirement Type: {requirement.requirement_type}",
            f"NLP Actions: {' | '.join(requirement.nlp_actions) if requirement.nlp_actions else 'None'}",
            "",
            "Retrieved Keywords:",
            keywords_section,
        ]
        if self.config.include_examples:
            prompt.extend(
                [
                    "",
                    "Project Examples:",
                    examples_block,
                ]
            )
        prompt.extend(
            [
                "",
                "Output Format:",
                "[ROBOT]",
                "<robot file content>",
                "[/ROBOT]",
                "[RESOURCE]",
                "<resource file content>",
                "[/RESOURCE]",
            ]
        )
        return "\n".join(prompt).strip() + "\n"
