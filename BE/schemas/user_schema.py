from pydantic import BaseModel, Field


class Profile(BaseModel):
    """profiles 테이블 조회 결과."""

    id: str
    nickname: str | None = None
    created_at: str


class UserProfileUpdate(BaseModel):
    """PATCH /api/v1/users/me 요청 본문."""

    nickname: str = Field(..., min_length=1, max_length=30)
