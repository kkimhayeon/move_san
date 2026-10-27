from pydantic import BaseModel, Field


class PolicyListQuery(BaseModel):
    """GET /api/policies 쿼리 파라미터."""

    q: str | None = None
    category: str | None = None
    favorites_only: bool = False
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
