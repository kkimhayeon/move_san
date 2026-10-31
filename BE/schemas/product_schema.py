from pydantic import BaseModel, Field


class ProductListQuery(BaseModel):
    """GET /api/financial-products 쿼리 파라미터."""

    q: str | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
