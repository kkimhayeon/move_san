"""Supabase JWT 검증 및 요청 사용자 추출 유틸."""

from functools import wraps
from typing import Any, Callable, Optional

from flask import g, jsonify, request

from services.auth_service import AuthError, verify_token

AUTH_REQUIRED_MESSAGE = "로그인이 필요한 요청이거나 제공한 토큰이 유효하지 않습니다."


def get_bearer_token() -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    return token or None


def get_current_user() -> Optional[dict[str, Any]]:
    return getattr(g, "current_user", None)


def _unauthorized():
    return jsonify({
        "status": 401,
        "message": AUTH_REQUIRED_MESSAGE,
        "result": None,
    }), 401


def require_auth(fn: Callable):
    """Authorization: Bearer <access_token> 필수. 검증 성공 시 g.current_user 설정."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        if not token:
            return _unauthorized()

        # Authorization 헤더가 있으나 Bearer 형식이 아닌 경우
        auth_header = request.headers.get("Authorization", "")
        if auth_header and not auth_header.startswith("Bearer "):
            return _unauthorized()

        try:
            g.current_user = verify_token(token)
        except AuthError:
            return _unauthorized()

        return fn(*args, **kwargs)

    return wrapper


def optional_auth(fn: Callable):
    """
    Authorization 생략 시 비회원 조회.
    Bearer 형식이 아니거나 토큰이 무효/만료면 401.
    유효하면 g.current_user 설정.
    """

    @wraps(fn)
    def wrapper(*args, **kwargs):
        g.current_user = None
        auth_header = request.headers.get("Authorization")
        if auth_header is None or auth_header == "":
            return fn(*args, **kwargs)

        if not auth_header.startswith("Bearer "):
            return _unauthorized()

        token = auth_header[7:].strip()
        if not token:
            return _unauthorized()

        try:
            g.current_user = verify_token(token)
        except AuthError:
            return _unauthorized()

        return fn(*args, **kwargs)

    return wrapper
