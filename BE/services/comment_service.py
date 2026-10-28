"""커뮤니티 댓글 서비스."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from config import supabase
from schemas.post_schema import display_nickname
from services.post_service import (
    PostNotFoundError,
    PostQueryError,
    ProfileMissingError,
    post_exists_active,
)


class CommentNotFoundError(Exception):
    """없거나 삭제된 댓글(또는 부모 글 삭제)."""


class CommentForbiddenError(Exception):
    """댓글 작성자가 아님."""


class CommentQueryError(Exception):
    """DB 조회/저장 실패."""


_COMMENT_SELECT = (
    "id, content, created_at, author_id, post_id, "
    "author:profiles!author_id(nickname)"
)


def _author_payload(row: dict[str, Any]) -> dict[str, str]:
    author = row.get("author")
    nickname = None
    if isinstance(author, dict):
        nickname = author.get("nickname")
    elif isinstance(author, list) and author:
        nickname = author[0].get("nickname") if isinstance(author[0], dict) else None
    return {"nickname": display_nickname(nickname)}


def _to_comment(row: dict[str, Any], viewer_id: Optional[str]) -> dict[str, Any]:
    author_id = row.get("author_id")
    return {
        "id": str(row["id"]),
        "content": row["content"],
        "author": _author_payload(row),
        "created_at": row["created_at"],
        "is_author": bool(viewer_id) and str(author_id) == str(viewer_id),
    }


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
        raise CommentQueryError("프로필 확인 실패") from exc
    if not (response.data or []):
        raise ProfileMissingError(user_id)


def list_comments(
    *,
    post_id: str,
    page: int,
    page_size: int,
    viewer_id: Optional[str],
) -> dict[str, Any]:
    if not post_exists_active(post_id):
        raise PostNotFoundError(post_id)

    try:
        start = (page - 1) * page_size
        end = start + page_size - 1
        response = (
            supabase.table("comments")
            .select(_COMMENT_SELECT, count="exact")
            .eq("post_id", post_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=False)
            .order("id", desc=False)
            .range(start, end)
            .execute()
        )
    except Exception as exc:
        raise CommentQueryError("댓글 목록 조회 실패") from exc

    rows = response.data or []
    total = response.count if response.count is not None else len(rows)
    return {
        "items": [_to_comment(row, viewer_id) for row in rows],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


def create_comment(*, post_id: str, author_id: str, content: str) -> dict[str, Any]:
    """
    부모 글 존재 확인 후 insert.
    REST 두 단계라 글 삭제와 댓글 작성이 동시에 일어나면 TOCTOU가 남을 수 있다.
    insert 직후 부모 글을 다시 확인해 삭제됐으면 방금 댓글을 soft-delete하고 404.
    (완전 원자 트랜잭션은 RPC 없이 보장하지 않음.)
    """
    if not post_exists_active(post_id):
        raise PostNotFoundError(post_id)
    _ensure_profile(author_id)

    try:
        response = (
            supabase.table("comments")
            .insert({
                "post_id": post_id,
                "author_id": author_id,
                "content": content,
            })
            .execute()
        )
    except Exception as exc:
        raise CommentQueryError("댓글 작성 실패") from exc

    rows = response.data or []
    if not rows:
        raise CommentQueryError("댓글 작성 결과 없음")

    comment_id = str(rows[0]["id"])

    if not post_exists_active(post_id):
        # 경합: 글이 삭제됨 → 방금 단 댓글도 공개 제외
        try:
            now = datetime.now(timezone.utc).isoformat()
            (
                supabase.table("comments")
                .update({"deleted_at": now})
                .eq("id", comment_id)
                .is_("deleted_at", "null")
                .execute()
            )
        except Exception:
            pass
        raise PostNotFoundError(post_id)

    try:
        detail = (
            supabase.table("comments")
            .select(_COMMENT_SELECT)
            .eq("id", comment_id)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise CommentQueryError("댓글 재조회 실패") from exc

    detail_rows = detail.data or []
    if not detail_rows:
        raise CommentQueryError("댓글 재조회 결과 없음")
    return _to_comment(detail_rows[0], author_id)


def delete_comment(*, comment_id: str, author_id: str) -> None:
    try:
        existing = (
            supabase.table("comments")
            .select("id, author_id, deleted_at, post_id")
            .eq("id", comment_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise CommentQueryError("댓글 삭제 조회 실패") from exc

    rows = existing.data or []
    if not rows or rows[0].get("deleted_at") is not None:
        raise CommentNotFoundError(comment_id)

    post_id = str(rows[0]["post_id"])
    if not post_exists_active(post_id):
        raise CommentNotFoundError(comment_id)

    if str(rows[0]["author_id"]) != str(author_id):
        raise CommentForbiddenError(comment_id)

    try:
        now = datetime.now(timezone.utc).isoformat()
        response = (
            supabase.table("comments")
            .update({"deleted_at": now})
            .eq("id", comment_id)
            .eq("author_id", author_id)
            .is_("deleted_at", "null")
            .select("id")
            .execute()
        )
    except Exception as exc:
        raise CommentQueryError("댓글 삭제 실패") from exc

    if not (response.data or []):
        raise CommentNotFoundError(comment_id)
