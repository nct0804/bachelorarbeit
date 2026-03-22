from __future__ import annotations

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

CURRENT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = CURRENT_DIR.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from src.components.semantic import semantic_mapper
from src.components.rag.models import RetrievedKeyword


@dataclass
class RetrievalConfig:
    """Configuration for hybrid retrieval."""

    top_k: int = 5
    semantic_weight: float = 0.85
    lexical_weight: float = 0.15
    embedding_backend: str = "auto"
    sentence_model: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384
    keyword_scope: str = "all"


class HybridRetriever:
    """Hybrid semantic + lexical retriever for Robot Framework keywords."""

    def __init__(self, config: RetrievalConfig) -> None:
        self.config = config
        self.semantic_weight, self.lexical_weight = self._normalize_weights(
            config.semantic_weight,
            config.lexical_weight,
        )
        self.keyword_catalog: list[semantic_mapper.KeywordEntry] = []
        self.keyword_texts: list[str] = []
        self.keyword_vectors: list[list[float]] = []
        self.embedding_model: object | None = None
        self.embedding_backend_name: str = "local"

    @staticmethod
    def _normalize_weights(semantic_weight: float, lexical_weight: float) -> tuple[float, float]:
        if semantic_weight < 0 or lexical_weight < 0:
            raise ValueError("Similarity weights must be non-negative.")
        total_weight = semantic_weight + lexical_weight
        if total_weight <= 0:
            raise ValueError("At least one similarity weight must be > 0.")
        return semantic_weight / total_weight, lexical_weight / total_weight

    def load_catalog(self, resource_root: Path) -> None:
        catalog = semantic_mapper.extract_keyword_catalog(resource_root)
        catalog = semantic_mapper.filter_catalog_to_executable(catalog)
        catalog = semantic_mapper.filter_catalog_by_scope(catalog, self.config.keyword_scope)
        if not catalog:
            raise ValueError("No executable keywords found under the resource root.")
        self.keyword_catalog = catalog

    def prepare_index(self) -> None:
        if not self.keyword_catalog:
            raise ValueError("Keyword catalog is empty. Call load_catalog first.")

        self.keyword_texts = [
            entry.normalized_text
            or semantic_mapper.normalize_text(
                f"{entry.keyword_name} {entry.documentation} {entry.arguments}",
                remove_stops=True,
                ignore_quoted_text=False,
            )
            for entry in self.keyword_catalog
        ]

        if self.semantic_weight <= 0:
            self.embedding_model = None
            self.keyword_vectors = []
            return

        self.embedding_model, self.embedding_backend_name = semantic_mapper.build_embedding_model(
            backend=self.config.embedding_backend,
            sentence_model=self.config.sentence_model,
            embedding_dim=self.config.embedding_dim,
        )
        self.embedding_model.fit(self.keyword_texts)
        self.keyword_vectors = self.embedding_model.encode_many(self.keyword_texts)

    def retrieve(
        self,
        requirement_text: str,
        mapping_text: str,
        ignore_quoted_text: bool = True,
        top_k: int | None = None,
    ) -> list[RetrievedKeyword]:
        if not self.keyword_catalog:
            raise ValueError("Keyword catalog is empty. Call load_catalog first.")
        if not self.keyword_texts:
            self.prepare_index()

        resolved_top_k = top_k if top_k is not None else self.config.top_k
        if resolved_top_k <= 0:
            raise ValueError("top_k must be a positive integer.")

        mapping_source = mapping_text or requirement_text
        normalized_requirement = semantic_mapper.normalize_text(
            mapping_source,
            remove_stops=True,
            ignore_quoted_text=ignore_quoted_text,
        )
        requirement_vector: list[float] | None = None
        if self.embedding_model is not None:
            requirement_vector = self.embedding_model.encode(normalized_requirement)

        scored: list[tuple[float, semantic_mapper.KeywordEntry, float, float, float, float]] = []
        for vector, keyword in zip(self.keyword_vectors, self.keyword_catalog):
            semantic_score = 0.0
            if requirement_vector is not None:
                semantic_score = semantic_mapper.dot_product(requirement_vector, vector)
            lexical_score = semantic_mapper.calculate_lexical_similarity(
                mapping_source,
                f"{keyword.keyword_name} {keyword.documentation} {keyword.arguments}",
                ignore_quoted_text_source=ignore_quoted_text,
            )
            keyword_text = f"{keyword.keyword_name} {keyword.documentation}"
            element_boost = semantic_mapper.calculate_element_type_boost(mapping_source, keyword_text)
            disambiguation_penalty = semantic_mapper.calculate_disambiguation_penalty(
                mapping_source,
                keyword_text,
            )

            base_score = (self.semantic_weight * semantic_score) + (self.lexical_weight * lexical_score)
            final_score = max(0.0, base_score + element_boost - disambiguation_penalty)
            scored.append(
                (
                    final_score,
                    keyword,
                    semantic_score,
                    lexical_score,
                    element_boost,
                    disambiguation_penalty,
                )
            )

        scored.sort(key=lambda item: item[0], reverse=True)
        top_matches = scored[:resolved_top_k]
        return [
            RetrievedKeyword(
                keyword_name=keyword.keyword_name,
                tag_type=keyword.tag_type,
                module=keyword.module,
                source_file=keyword.source_file,
                documentation=keyword.documentation,
                arguments=keyword.arguments,
                final_score=final_score,
                semantic_score=semantic_score,
                lexical_score=lexical_score,
                element_boost=element_boost,
                disambiguation_penalty=disambiguation_penalty,
            )
            for final_score, keyword, semantic_score, lexical_score, element_boost, disambiguation_penalty in top_matches
        ]

    def retrieve_with_scores(
        self,
        requirement_texts: Iterable[str],
        mapping_texts: Iterable[str],
        ignore_quoted_text: bool = True,
    ) -> list[list[RetrievedKeyword]]:
        results: list[list[RetrievedKeyword]] = []
        for requirement_text, mapping_text in zip(requirement_texts, mapping_texts):
            results.append(
                self.retrieve(
                    requirement_text=requirement_text,
                    mapping_text=mapping_text,
                    ignore_quoted_text=ignore_quoted_text,
                )
            )
        return results
