"""혜택(support_policies) 공개 목록/카테고리 서비스."""

from __future__ import annotations

from typing import Any, Optional

from config import supabase
from schemas.policy_schema import (
    POLICY_LIST_SELECT,
    categories_payload,
    serialize_policy_item,
)


class PolicyQueryError(Exception):
    """DB 조회 실패."""


def _has_usable_official_url(row: dict[str, Any]) -> bool:
    url = row.get("official_url")
    return isinstance(url, str) and bool(url.strip())


def list_policies(
    *,
    q: Optional[str] = None,
    category: Optional[str] = None,
) -> dict[str, Any]:
    """
    is_visible=true 이고 official_url이 비어 있지 않은 행만 반환.
    service_role로 RLS를 우회하더라도 공개 조건은 여기서 강제한다.
    """
    try:
        query = (
            supabase.table("support_policies")
            .select(POLICY_LIST_SELECT)
            .eq("is_visible", True)
            .not_.is_("official_url", "null")
            .neq("official_url", "")
        )
        if category:
            query = query.eq("category", category)
        if q:
            # SDK ilike — 필터 문자열에 검색어를 직접 이어 붙이지 않음
            query = query.ilike("policy_name", f"%{q}%")
        response = query.order("policy_id").execute()
    except Exception as exc:
        raise PolicyQueryError("혜택 목록 조회 실패") from exc

    items = [
        serialize_policy_item(row)
        for row in (response.data or [])
        if _has_usable_official_url(row)
    ]
    return {"items": items, "total": len(items)}


def list_categories() -> dict[str, list[str]]:
    """고정 카테고리 목록(데이터 유무와 무관)."""
    return categories_payload()
