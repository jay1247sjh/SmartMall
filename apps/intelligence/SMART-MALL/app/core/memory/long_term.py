"""长期记忆：PostgreSQL 存储用户偏好

使用 asyncpg 直接操作 user_preferences 表。
偏好冲突时以最新写入为准（Last-Write-Wins），通过 UPSERT 实现。
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class LongTermMemory:
    """长期记忆：PostgreSQL 存储用户偏好

    - load(): 加载用户所有偏好
    - save_preference(): 保存/更新单条偏好（Last-Write-Wins）
    - extract_and_save_preferences(): 从对话消息中提取偏好并保存
    """

    def __init__(self, user_id: str):
        self.user_id = user_id

    async def _get_connection(self):
        """获取 asyncpg 连接"""
        import asyncpg
        from app.core.config import get_settings
        settings = get_settings()
        return await asyncpg.connect(settings.pg_dsn)

    async def load(self) -> Optional[Dict[str, str]]:
        """加载用户所有偏好，返回 {preference_key: preference_value} 字典"""
        try:
            conn = await self._get_connection()
            try:
                rows = await conn.fetch(
                    """
                    SELECT preference_key, preference_value
                    FROM user_preferences
                    WHERE user_id = $1 AND is_deleted = FALSE
                    """,
                    self.user_id,
                )
                if not rows:
                    return None
                return {row["preference_key"]: row["preference_value"] for row in rows}
            finally:
                await conn.close()
        except Exception as e:
            logger.warning(json.dumps({
                "event": "long_term_memory_load_failed",
                "user_id": self.user_id,
                "reason": str(e),
            }, ensure_ascii=False))
            return None

    async def save_preference(
        self, key: str, value: str, session_id: str = ""
    ) -> bool:
        """保存/更新偏好（Last-Write-Wins）

        使用 INSERT ... ON CONFLICT ... DO UPDATE 实现 UPSERT。
        同一 (user_id, preference_key) 只保留最新值。
        """
        try:
            conn = await self._get_connection()
            try:
                await conn.execute(
                    """
                    INSERT INTO user_preferences
                        (user_id, preference_key, preference_value, source_session_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id, preference_key) WHERE is_deleted = FALSE
                    DO UPDATE SET
                        preference_value = EXCLUDED.preference_value,
                        source_session_id = EXCLUDED.source_session_id,
                        update_time = CURRENT_TIMESTAMP
                    """,
                    self.user_id,
                    key,
                    value,
                    session_id,
                )
                return True
            finally:
                await conn.close()
        except Exception as e:
            logger.error(json.dumps({
                "event": "long_term_memory_save_failed",
                "user_id": self.user_id,
                "preference_key": key,
                "reason": str(e),
            }, ensure_ascii=False))
            return False

    async def extract_and_save_preferences(
        self, messages: list, session_id: str = ""
    ) -> List[Dict[str, str]]:
        """从对话消息中使用 LLM 提取用户偏好并保存

        提取的偏好类型：brand（品牌）、category（品类）、
        price_range（价格区间）、diet（饮食偏好）等。
        """
        if not messages:
            return []

        try:
            from app.core.llm_provider import get_llm

            llm = get_llm()
            messages_text = "\n".join(
                f"{getattr(m, 'role', 'unknown')}: {getattr(m, 'content', str(m))}"
                for m in messages
            )

            prompt = (
                "从以下对话中提取用户偏好信息，以 JSON 数组格式返回。\n"
                "每条偏好格式：{\"key\": \"偏好类型\", \"value\": \"偏好值\"}\n"
                "偏好类型包括：brand, category, price_range, diet, style, size\n"
                "如果没有明确偏好，返回空数组 []\n"
                "只返回 JSON，不要其他文字。\n\n"
                f"对话内容：\n{messages_text}"
            )

            result = await llm.ainvoke(prompt)
            content = result.content if hasattr(result, "content") else str(result)

            # 解析 JSON
            content = content.strip()
            if content.startswith("```"):
                content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

            preferences = json.loads(content)
            saved = []

            for pref in preferences:
                if isinstance(pref, dict) and "key" in pref and "value" in pref:
                    success = await self.save_preference(
                        pref["key"], pref["value"], session_id
                    )
                    if success:
                        saved.append(pref)

            return saved

        except Exception as e:
            logger.warning(json.dumps({
                "event": "preference_extraction_failed",
                "user_id": self.user_id,
                "reason": str(e),
            }, ensure_ascii=False))
            return []
