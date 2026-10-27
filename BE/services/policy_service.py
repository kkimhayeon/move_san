"""정책 목록/카테고리/즐겨찾기 서비스."""

from typing import Any, Optional


def list_policies(
    *,
    q: Optional[str] = None,
    category: Optional[str] = None,
    favorites_only: bool = False,
    user_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict[str, Any]:
    raise NotImplementedError("policy_service.list_policies 미구현")


def list_categories() -> list[dict[str, Any]]:
    raise NotImplementedError("policy_service.list_categories 미구현")


def add_favorite(user_id: str, policy_id: str) -> None:
    raise NotImplementedError("policy_service.add_favorite 미구현")


def remove_favorite(user_id: str, policy_id: str) -> None:
    raise NotImplementedError("policy_service.remove_favorite 미구현")
