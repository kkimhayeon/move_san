"""사용자 프로필 조회/수정 서비스."""

from typing import Any, Optional

from config import supabase
from schemas.user_schema import Profile


class ProfileNotFoundError(Exception):
    """profiles 행이 없을 때."""


def get_me(user_id: str) -> dict[str, Any]:
    """auth.users.id(=JWT sub)와 동일한 profiles.id 조회."""
    response = (
        supabase.table("profiles")
        .select("id, nickname, created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ProfileNotFoundError(user_id)

    row = rows[0]
    profile = Profile(
        id=str(row["id"]),
        nickname=row["nickname"],
        created_at=row["created_at"],
    )
    return profile.model_dump()


def update_me(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    raise NotImplementedError("user_service.update_me 미구현")
