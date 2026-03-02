"""聊天主链路 RAG 编排器（hybrid/tool_only/always）。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.core.config import get_settings


@dataclass
class EvidenceItem:
    """可追溯证据项。"""

    id: str
    source_type: str
    source_collection: str
    score: float
    snippet: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source_type": self.source_type,
            "source_collection": self.source_collection,
            "score": round(self.score, 4),
            "snippet": self.snippet,
        }


class RAGOrchestrator:
    """RAG 增强编排器。"""

    NAVIGATION_KEYWORDS = (
        "导航",
        "带我去",
        "在哪",
        "在哪里",
        "怎么走",
        "位置",
        "去",
    )
    EVALUATION_KEYWORDS = (
        "评价",
        "评论",
        "口碑",
        "评分",
        "好不好",
        "值不值",
    )
    COMPLEX_KEYWORDS = (
        "推荐",
        "搜索",
        "找",
        "买",
        "商品",
        "店铺",
        "餐厅",
        "吃什么",
        "哪个",
    )

    @classmethod
    def _get_rag_service(cls):
        from app.core.rag.service import get_rag_service

        return get_rag_service()

    @classmethod
    async def augment(
        cls,
        query: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """根据配置决定是否执行 RAG，并返回上下文与证据。"""
        settings = get_settings()
        mode = (settings.AGENT_RAG_MODE or "hybrid").lower()
        if mode == "tool_only":
            return cls._empty("tool_only")

        strategy = cls._route_strategy(query, mode=mode)
        if strategy == "none":
            return cls._empty("none")

        rag = cls._get_rag_service()
        if strategy == "navigation":
            docs = await rag.search_for_navigation(query)
        elif strategy == "evaluation":
            docs = await rag.search_for_evaluation(query)
        else:
            docs = await rag.search_for_complex(query)

        evidences = cls._collect_evidence(query, docs)
        evidences = [e for e in evidences if e.score >= settings.AGENT_RAG_MIN_SCORE]
        if not evidences:
            return cls._empty(strategy)

        if settings.RAG_RERANK_ENABLED:
            evidences = cls._rerank(query, evidences)

        evidences = evidences[: max(1, settings.AGENT_RAG_TOP_K)]
        rag_context = cls._build_context_text(
            evidences,
            max_chars=settings.AGENT_RAG_MAX_CONTEXT_CHARS,
        )
        return {
            "rag_used": True,
            "retrieval_strategy": strategy,
            "evidence": [e.to_dict() for e in evidences],
            "rag_context": rag_context,
        }

    @classmethod
    def _empty(cls, strategy: str) -> Dict[str, Any]:
        fallback_hint = ""
        if strategy in {"navigation", "evaluation", "complex"}:
            fallback_hint = (
                "检索证据不足。请避免臆测具体商品、价格或位置，"
                "优先调用工具查询，或先向用户补充关键信息。"
            )
        return {
            "rag_used": False,
            "retrieval_strategy": strategy,
            "evidence": [],
            "rag_context": fallback_hint,
        }

    @classmethod
    def _route_strategy(cls, query: str, mode: str) -> str:
        lowered = (query or "").lower()
        if mode == "always":
            return "complex"
        if any(k in lowered for k in cls.NAVIGATION_KEYWORDS):
            return "navigation"
        if any(k in lowered for k in cls.EVALUATION_KEYWORDS):
            return "evaluation"
        if any(k in lowered for k in cls.COMPLEX_KEYWORDS):
            return "complex"
        return "none"

    @classmethod
    def _collect_evidence(cls, query: str, docs: List[Any]) -> List[EvidenceItem]:
        evidences: List[EvidenceItem] = []
        for idx, doc in enumerate(docs):
            meta = getattr(doc, "metadata", {}) or {}
            content = str(meta.get("content") or getattr(doc, "page_content", "") or "")
            snippet = content.strip()[:120]
            if not snippet:
                continue
            evidences.append(
                EvidenceItem(
                    id=str(meta.get("id", f"doc_{idx}")),
                    source_type=str(meta.get("source_type", "unknown")),
                    source_collection=str(meta.get("source_collection", "unknown")),
                    score=cls._resolve_score(meta, query, snippet),
                    snippet=snippet,
                )
            )
        return evidences

    @classmethod
    def _resolve_score(cls, meta: Dict[str, Any], query: str, snippet: str) -> float:
        raw = meta.get("score")
        if isinstance(raw, (int, float)):
            return float(raw)
        # 轻量 lexical fallback
        terms = [t for t in query.lower().split() if t]
        if not terms:
            return 0.5
        hits = sum(1 for t in terms if t in snippet.lower())
        return min(1.0, 0.4 + 0.15 * hits)

    @classmethod
    def _rerank(cls, query: str, evidences: List[EvidenceItem]) -> List[EvidenceItem]:
        lowered = query.lower()
        scored = []
        for e in evidences:
            bonus = 0.0
            if e.source_type == "rules":
                bonus += 0.03
            if any(token in e.snippet.lower() for token in lowered.split() if token):
                bonus += 0.05
            scored.append((e.score + bonus, e))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [e for _, e in scored]

    @classmethod
    def _build_context_text(cls, evidences: List[EvidenceItem], max_chars: int) -> str:
        lines = []
        for i, e in enumerate(evidences, start=1):
            lines.append(
                f"{i}. [{e.source_type}/{e.source_collection}] "
                f"id={e.id} score={e.score:.3f} 摘要={e.snippet}"
            )
        text = "\n".join(lines)
        return text[:max_chars] if len(text) > max_chars else text
