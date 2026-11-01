from pydantic import BaseModel


class TokenPayload(BaseModel):
    """Supabase JWT 검증 후 내부에서 쓰는 사용자 정보."""

    user_id: str
    email: str | None = None


class AuthVerifyResult(BaseModel):
    """GET /api/v1/auth/verify 성공 result."""

    user_id: str
    email: str | None = None
