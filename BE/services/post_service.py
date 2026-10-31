"""커뮤니티 글 서비스."""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from postgrest.exceptions import APIError

from config import supabase
from schemas.post_schema import display_nickname
from services.upload_service import BUCKET

logger = logging.getLogger(__name__)

# 목록 조회 전용: 일시적 연결 끊김 시 1회 재시도 (최초 포함 최대 2회).
# postgrest send_with_retry는 HTTP 503/520 응답만 재시도하므로 RemoteProtocolError와 중복되지 않음.
_LIST_CONNECTION_MAX_ATTEMPTS = 2
_LIST_CONNECTION_RETRY_DELAY_SEC = 0.3


class PostNotFoundError(Exception):
    """없거나 삭제된 글."""


class PostForbiddenError(Exception):
    """작성자가 아님."""


class CategoryNotFoundError(Exception):
    """존재하지 않는 카테고리."""


class ProfileMissingError(Exception):
    """작성자 profiles 행 없음."""


class ImageAttachError(Exception):
    """사진 연결 실패 (없는/타인/이미연결/중복 등)."""


class PostQueryError(Exception):
    """DB 조회/저장 실패."""


class PostConnectionError(Exception):
    """일시적 Supabase 연결 실패(재시도 후에도 실패)."""


_POST_SELECT = (
    "id, title, content, category_code, created_at, updated_at, author_id, "
    "author:profiles!author_id(nickname)"
)
_POST_SUMMARY_SELECT = (
    "id, title, category_code, created_at, author_id, "
    "author:profiles!author_id(nickname)"
)


def _escape_postgrest_ilike_value(term: str) -> str:
    escaped = (
        term.replace("\\", "\\\\")
        .replace("*", "\\*")
        .replace("-", "\\-")
        .replace('"', '""')
    )
    return f'"*{escaped}*"'


def _author_payload(row: dict[str, Any]) -> dict[str, str]:
    author = row.get("author")
    nickname = None
    if isinstance(author, dict):
        nickname = author.get("nickname")
    elif isinstance(author, list) and author:
        nickname = author[0].get("nickname") if isinstance(author[0], dict) else None
    return {"nickname": display_nickname(nickname)}


def _is_author(author_id: Any, viewer_id: Optional[str]) -> bool:
    if viewer_id is None or author_id is None:
        return False
    return str(author_id) == str(viewer_id)


def _image_item(row: dict[str, Any]) -> dict[str, str]:
    return {
        "id": str(row["id"]),
        "url": row.get("public_url") or "",
    }


def list_categories() -> dict[str, Any]:
    try:
        response = (
            supabase.table("post_categories")
            .select("code, name")
            .order("sort_order")
            .order("code")
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("카테고리 조회 실패") from exc
    items = [
        {"code": row["code"], "name": row["name"]}
        for row in (response.data or [])
    ]
    return {"items": items}


def _total_from_range_error(details: Optional[str]) -> Optional[int]:
    if not details:
        return None
    matched = re.search(r"only (\d+) rows?", details)
    if not matched:
        return None
    return int(matched.group(1))


def _apply_list_filters(
    query: Any,
    q: Optional[str],
    category_code: Optional[str],
) -> Any:
    query = query.is_("deleted_at", "null")
    if category_code:
        query = query.eq("category_code", category_code)
    if q:
        pattern = _escape_postgrest_ilike_value(q)
        query = query.or_(f"title.ilike.{pattern},content.ilike.{pattern}")
    return query


def _count_filtered_posts(q: Optional[str], category_code: Optional[str]) -> int:
    try:
        query = supabase.table("posts").select("id", count="exact")
        query = _apply_list_filters(query, q, category_code)
        response = query.limit(1).execute()
    except Exception as exc:
        raise PostQueryError("글 목록 건수 조회 실패") from exc
    return int(response.count or 0)


def _fetch_thumbnails(post_ids: list[str]) -> dict[str, str | None]:
    """게시글별 첫 사진 URL을 일괄 조회 (N+1 방지)."""
    result: dict[str, str | None] = {pid: None for pid in post_ids}
    if not post_ids:
        return result
    try:
        response = (
            supabase.table("post_images")
            .select("post_id, public_url, sort_order")
            .in_("post_id", post_ids)
            .is_("deleted_at", "null")
            .order("sort_order")
            .order("id")
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("썸네일 조회 실패") from exc

    for row in response.data or []:
        pid = str(row.get("post_id"))
        if pid in result and result[pid] is None:
            result[pid] = row.get("public_url")
    return result


def _fetch_post_images(post_id: str) -> list[dict[str, str]]:
    try:
        response = (
            supabase.table("post_images")
            .select("id, public_url, sort_order")
            .eq("post_id", post_id)
            .is_("deleted_at", "null")
            .order("sort_order")
            .order("id")
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("사진 목록 조회 실패") from exc
    return [_image_item(row) for row in (response.data or [])]


def _to_summary(
    row: dict[str, Any],
    viewer_id: Optional[str],
    thumbnail_url: str | None,
) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "author": _author_payload(row),
        "created_at": row["created_at"],
        "category_code": row["category_code"],
        "thumbnail_url": thumbnail_url,
        "is_author": _is_author(row.get("author_id"), viewer_id),
    }


def _to_detail(
    row: dict[str, Any],
    viewer_id: Optional[str],
    images: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "title": row["title"],
        "content": row["content"],
        "author": _author_payload(row),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "category_code": row["category_code"],
        "images": images,
        "is_author": _is_author(row.get("author_id"), viewer_id),
    }


def _is_transient_list_connection_error(exc: BaseException) -> bool:
    return isinstance(exc, httpx.RemoteProtocolError)


def _execute_posts_page_query(
    *,
    start: int,
    end: int,
    q: Optional[str],
    category_code: Optional[str],
) -> Any:
    """목록 페이지 쿼리를 매번 새로 구성해 실행 (재시도 시 안전)."""
    query = supabase.table("posts").select(_POST_SUMMARY_SELECT, count="exact")
    query = _apply_list_filters(query, q, category_code)
    return (
        query.order("created_at", desc=True)
        .order("id", desc=True)
        .range(start, end)
        .execute()
    )


def list_posts(
    *,
    page: int,
    page_size: int,
    q: Optional[str],
    category_code: Optional[str],
    viewer_id: Optional[str],
) -> dict[str, Any]:
    if category_code:
        _ensure_category(category_code)

    start = (page - 1) * page_size
    end = start + page_size - 1
    response = None
    for attempt in range(1, _LIST_CONNECTION_MAX_ATTEMPTS + 1):
        try:
            response = _execute_posts_page_query(
                start=start,
                end=end,
                q=q,
                category_code=category_code,
            )
            if attempt > 1:
                logger.info(
                    "글 목록 조회 재시도 성공 attempt=%s page=%s page_size=%s",
                    attempt,
                    page,
                    page_size,
                )
            break
        except APIError as exc:
            if exc.code == "PGRST103":
                total = _total_from_range_error(exc.details)
                if total is None:
                    total = _count_filtered_posts(q, category_code)
                return {
                    "items": [],
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                }
            raise PostQueryError("글 목록 조회 실패") from exc
        except Exception as exc:
            if (
                _is_transient_list_connection_error(exc)
                and attempt < _LIST_CONNECTION_MAX_ATTEMPTS
            ):
                logger.warning(
                    "글 목록 조회 연결 실패, 재시도합니다 attempt=%s page=%s page_size=%s error=%s",
                    attempt,
                    page,
                    page_size,
                    type(exc).__name__,
                )
                time.sleep(_LIST_CONNECTION_RETRY_DELAY_SEC)
                continue
            if _is_transient_list_connection_error(exc):
                logger.error(
                    "글 목록 조회 연결 최종 실패 attempts=%s page=%s page_size=%s error=%s",
                    attempt,
                    page,
                    page_size,
                    type(exc).__name__,
                )
                raise PostConnectionError("글 목록 연결 실패") from exc
            raise PostQueryError("글 목록 조회 실패") from exc

    assert response is not None
    rows = response.data or []
    total = response.count if response.count is not None else len(rows)
    post_ids = [str(row["id"]) for row in rows]
    thumbs = _fetch_thumbnails(post_ids)
    return {
        "items": [
            _to_summary(row, viewer_id, thumbs.get(str(row["id"])))
            for row in rows
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def get_post(post_id: str, viewer_id: Optional[str]) -> dict[str, Any]:
    try:
        response = (
            supabase.table("posts")
            .select(_POST_SELECT)
            .eq("id", post_id)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("글 상세 조회 실패") from exc

    rows = response.data or []
    if not rows:
        raise PostNotFoundError(post_id)
    images = _fetch_post_images(post_id)
    return _to_detail(rows[0], viewer_id, images)


def _ensure_category(category_code: str) -> None:
    try:
        response = (
            supabase.table("post_categories")
            .select("code")
            .eq("code", category_code)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("카테고리 확인 실패") from exc
    if not (response.data or []):
        raise CategoryNotFoundError(category_code)


def _ensure_profile(user_id: str) -> None:
    try:
        response = (
            supabase.table("profiles")
            .select("id")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("프로필 확인 실패") from exc
    if not (response.data or []):
        raise ProfileMissingError(user_id)


def _soft_delete_post_row(post_id: str, author_id: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    (
        supabase.table("posts")
        .update({"deleted_at": now, "updated_at": now})
        .eq("id", post_id)
        .eq("author_id", author_id)
        .is_("deleted_at", "null")
        .execute()
    )


def create_post(
    *,
    author_id: str,
    title: str,
    content: str,
    category_code: str,
    image_ids: list[str],
) -> dict[str, Any]:
    _ensure_profile(author_id)
    _ensure_category(category_code)

    try:
        response = (
            supabase.table("posts")
            .insert({
                "author_id": author_id,
                "title": title,
                "content": content,
                "category_code": category_code,
            })
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("글 작성 실패") from exc

    rows = response.data or []
    if not rows:
        raise PostQueryError("글 작성 결과 없음")

    post_id = str(rows[0]["id"])

    if image_ids:
        try:
            supabase.rpc(
                "attach_post_images",
                {
                    "p_post_id": post_id,
                    "p_owner_id": author_id,
                    "p_image_ids": image_ids,
                },
            ).execute()
        except Exception as exc:
            # 부분 연결 없이 글도 공개되지 않도록 soft-delete
            try:
                _soft_delete_post_row(post_id, author_id)
            except Exception:
                pass
            raise ImageAttachError("사진 연결에 실패했습니다.") from exc

    return get_post(post_id, author_id)


def _list_active_images_for_post(post_id: str) -> list[dict[str, Any]]:
    response = (
        supabase.table("post_images")
        .select("id, storage_path")
        .eq("post_id", post_id)
        .is_("deleted_at", "null")
        .execute()
    )
    return response.data or []


def delete_post(*, post_id: str, author_id: str) -> None:
    try:
        existing = (
            supabase.table("posts")
            .select("id, author_id, deleted_at")
            .eq("id", post_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("글 삭제 조회 실패") from exc

    rows = existing.data or []
    if not rows or rows[0].get("deleted_at") is not None:
        raise PostNotFoundError(post_id)
    if str(rows[0]["author_id"]) != str(author_id):
        raise PostForbiddenError(post_id)

    try:
        images = _list_active_images_for_post(post_id)
    except Exception as exc:
        raise PostQueryError("연결 사진 조회 실패") from exc

    now = datetime.now(timezone.utc).isoformat()
    try:
        response = (
            supabase.table("posts")
            .update({"deleted_at": now, "updated_at": now})
            .eq("id", post_id)
            .eq("author_id", author_id)
            .is_("deleted_at", "null")
            .select("id")
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("글 삭제 실패") from exc

    if not (response.data or []):
        raise PostNotFoundError(post_id)

    # 사진 soft delete (경로는 유지 → Storage 삭제 실패 시 재시도 가능)
    if images:
        try:
            (
                supabase.table("post_images")
                .update({"deleted_at": now})
                .eq("post_id", post_id)
                .is_("deleted_at", "null")
                .execute()
            )
        except Exception as exc:
            raise PostQueryError("사진 soft delete 실패") from exc

        paths = [row["storage_path"] for row in images if row.get("storage_path")]
        if paths:
            try:
                supabase.storage.from_(BUCKET).remove(paths)
            except Exception:
                # Public 버킷: URL은 soft delete만으로 차단되지 않음.
                # 파일 삭제 실패 시 storage_path 기록을 남겨 재시도 가능하게 한다.
                pass


def post_exists_active(post_id: str) -> bool:
    try:
        response = (
            supabase.table("posts")
            .select("id")
            .eq("id", post_id)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise PostQueryError("글 존재 확인 실패") from exc
    return bool(response.data)
