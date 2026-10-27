from decimal import Decimal

from pydantic import BaseModel, Field


class ComparisonInput(BaseModel):
    """POST /api/comparisons 요청 본문. 금액 단위: 만원."""

    seoul_pay: Decimal = Field(..., ge=0)
    busan_pay: Decimal = Field(..., ge=0)
    seoul_rent: Decimal = Field(..., ge=0)
    busan_rent: Decimal = Field(..., ge=0)
    living: Decimal = Field(..., ge=0)
