"""Supabase Auth access token 검증 서비스."""

from typing import Any

from config import supabase
from schemas.auth_schema import TokenPayload


class AuthError(Exception):
    """토큰 누락·만료·서명 실패 등 인증 실패."""


def verify_token(token: str) -> dict[str, Any]:
    """
    Bearer access token을 Supabase Auth 서버에 검증 요청한다.
    성공 시 user.id를 사용자 ID로 사용한다.
    """
    if not token or not token.strip():
        raise AuthError("토큰이 없습니다.")

    try:
        response = supabase.auth.get_user(token)
    except Exception as exc:
        raise AuthError("유효하지 않은 토큰입니다.") from exc

    user = getattr(response, "user", None)
    if user is None or not getattr(user, "id", None):
        raise AuthError("유효하지 않은 토큰입니다.")

    verified = TokenPayload(
        user_id=str(user.id),
        email=getattr(user, "email", None),
    )
    return verified.model_dump()
