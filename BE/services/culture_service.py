"""컬처라이프 공개 목록 서비스."""

from __future__ import annotations

import re
from datetime import date, datetime, timezone
from typing import Any, Optional

from postgrest.exceptions import APIError

from config import supabase
from schemas.culture_schema import (
    ARTICLE_LIST_SELECT,
    EVENT_LIST_SELECT,
    PLACE_LIST_SELECT,
    public_visibility_or_filter,
    serialize_article_item,
    serialize_event_item,
    serialize_place_item,
    today_kst,
)


class CultureQueryError(Exception):
    """DB 조회 실패."""


def _total_from_range_error(details: Optional[str]) -> Optional[int]:
    if not details:
        return None
    matched = re.search(r"only (\d+) rows?", details)
    if not matched:
        return None
    return int(matched.group(1))


def _empty_page(*, page: int, page_size: int, total: int) -> dict[str, Any]:
    return {
        "items": [],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def _count_events(
    *,
    section: str,
    category: Optional[str],
    district: Optional[str],
    today: date,
) -> int:
    try:
        query = (
            supabase.table("culture_events")
            .select("id", count="exact")
            .eq("status", "approved")
            .eq("section", section)
            .or_(public_visibility_or_filter(today))
        )
        if category:
            query = query.eq("category", category)
        if district:
            query = query.eq("district", district)
        response = query.limit(1).execute()
    except Exception as exc:
        raise CultureQueryError("컬처 행사 건수 조회 실패") from exc
    return int(response.count or 0)


def list_events(
    *,
    section: str,
    category: Optional[str],
    district: Optional[str],
    page: int,
    page_size: int,
    today: date | None = None,
) -> dict[str, Any]:
    """
    status=approved 강제. 종료 행사(종료 기준일 < 오늘)는 keep_after_end=true만.
    공개 조건·필터를 DB에서 적용한 뒤 count·페이지네이션.
    """
    day = today if today is not None else today_kst()
    start = (page - 1) * page_size
    end = start + page_size - 1
    try:
        query = (
            supabase.table("culture_events")
            .select(EVENT_LIST_SELECT, count="exact")
            .eq("status", "approved")
            .eq("section", section)
            .or_(public_visibility_or_filter(day))
        )
        if category:
            query = query.eq("category", category)
        if district:
            query = query.eq("district", district)
        response = (
            query.order("sort_weight", desc=True)
            .order("start_date", nullsfirst=False)
            .order("id")
            .range(start, end)
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST103":
            total = _total_from_range_error(exc.details)
            if total is None:
                total = _count_events(
                    section=section,
                    category=category,
                    district=district,
                    today=day,
                )
            return _empty_page(page=page, page_size=page_size, total=total)
        raise CultureQueryError("컬처 행사 목록 조회 실패") from exc
    except Exception as exc:
        raise CultureQueryError("컬처 행사 목록 조회 실패") from exc

    rows = response.data or []
    total = response.count if response.count is not None else len(rows)
    return {
        "items": [serialize_event_item(row, today=day) for row in rows],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def _count_places(*, kind: Optional[str], district: Optional[str]) -> int:
    try:
        query = (
            supabase.table("culture_places")
            .select("id", count="exact")
            .eq("is_published", True)
        )
        if kind:
            query = query.eq("kind", kind)
        if district:
            query = query.eq("district", district)
        response = query.limit(1).execute()
    except Exception as exc:
        raise CultureQueryError("컬처 공간 건수 조회 실패") from exc
    return int(response.count or 0)


def list_places(
    *,
    kind: Optional[str],
    district: Optional[str],
    page: int,
    page_size: int,
) -> dict[str, Any]:
    """is_published=true 강제. 좌표 없어도 반환. N+1 없음."""
    start = (page - 1) * page_size
    end = start + page_size - 1
    try:
        query = (
            supabase.table("culture_places")
            .select(PLACE_LIST_SELECT, count="exact")
            .eq("is_published", True)
        )
        if kind:
            query = query.eq("kind", kind)
        if district:
            query = query.eq("district", district)
        response = (
            query.order("display_order")
            .order("id")
            .range(start, end)
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST103":
            total = _total_from_range_error(exc.details)
            if total is None:
                total = _count_places(kind=kind, district=district)
            return _empty_page(page=page, page_size=page_size, total=total)
        raise CultureQueryError("컬처 공간 목록 조회 실패") from exc
    except Exception as exc:
        raise CultureQueryError("컬처 공간 목록 조회 실패") from exc

    rows = response.data or []
    total = response.count if response.count is not None else len(rows)
    return {
        "items": [serialize_place_item(row) for row in rows],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def _count_articles(*, article_type: Optional[str], now_iso: str) -> int:
    try:
        query = (
            supabase.table("culture_articles")
            .select("id", count="exact")
            .eq("is_published", True)
            .or_(f'expires_at.is.null,expires_at.gt."{now_iso}"')
        )
        if article_type:
            query = query.eq("article_type", article_type)
        response = query.limit(1).execute()
    except Exception as exc:
        raise CultureQueryError("컬처 글 건수 조회 실패") from exc
    return int(response.count or 0)


def list_articles(
    *,
    article_type: Optional[str],
    page: int,
    page_size: int,
    now: datetime | None = None,
) -> dict[str, Any]:
    """is_published=true 강제. expires_at NULL 또는 현재보다 미래만."""
    current = now if now is not None else datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    now_iso = current.astimezone(timezone.utc).isoformat()

    start = (page - 1) * page_size
    end = start + page_size - 1
    try:
        query = (
            supabase.table("culture_articles")
            .select(ARTICLE_LIST_SELECT, count="exact")
            .eq("is_published", True)
            .or_(f'expires_at.is.null,expires_at.gt."{now_iso}"')
        )
        if article_type:
            query = query.eq("article_type", article_type)
        response = (
            query.order("display_order")
            .order("id")
            .range(start, end)
            .execute()
        )
    except APIError as exc:
        if exc.code == "PGRST103":
            total = _total_from_range_error(exc.details)
            if total is None:
                total = _count_articles(article_type=article_type, now_iso=now_iso)
            return _empty_page(page=page, page_size=page_size, total=total)
        raise CultureQueryError("컬처 글 목록 조회 실패") from exc
    except Exception as exc:
        raise CultureQueryError("컬처 글 목록 조회 실패") from exc

    rows = response.data or []
    total = response.count if response.count is not None else len(rows)
    return {
        "items": [serialize_article_item(row) for row in rows],
        "page": page,
        "page_size": page_size,
        "total": total,
    }
