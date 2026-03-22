from __future__ import annotations

from dataclasses import dataclass
from typing import List

from src.components.rag.models import ExampleSnippet, RagContext, RagRequirement, RetrievedKeyword


@dataclass
class ContextConfig:
    """Configuration for context assembly."""

    max_keywords: int = 5
    max_examples: int = 2


class ContextBuilder:
    """Build prompt context from retrieved keywords and few-shot examples."""

    def __init__(self, config: ContextConfig) -> None:
        self.config = config

    def build(
        self,
        requirement: RagRequirement,
        retrieved_keywords: List[RetrievedKeyword],
        examples: List[ExampleSnippet],
    ) -> RagContext:
        limited_keywords = retrieved_keywords[: self.config.max_keywords]
        limited_examples = examples[: self.config.max_examples]
        return RagContext(
            requirement=requirement,
            retrieved_keywords=limited_keywords,
            examples=limited_examples,
        )

    def format_keywords(self, retrieved_keywords: List[RetrievedKeyword]) -> str:
        lines: list[str] = []
        for index, keyword in enumerate(retrieved_keywords[: self.config.max_keywords], start=1):
            args = keyword.arguments.strip() if keyword.arguments else ""
            doc = keyword.documentation.strip() if keyword.documentation else ""
            lines.append(
                f"{index}. {keyword.keyword_name} | module={keyword.module} | args={args} | doc={doc}"
            )
        return "\n".join(lines)

    def format_examples(self, examples: List[ExampleSnippet]) -> str:
        if not examples:
            return "None"
        lines: list[str] = []
        for index, example in enumerate(examples[: self.config.max_examples], start=1):
            lines.append(f"Example {index}: {example.feature_name}")
            lines.append("Feature Steps:")
            lines.append(example.feature_steps.strip() or "(empty)")
            lines.append("Robot Steps:")
            lines.append(example.robot_steps.strip() or "(empty)")
        return "\n".join(lines)
