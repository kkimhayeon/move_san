"""지도(구군 월세/순위) 응답·메타데이터 상수."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


PROPERTY_TYPES: tuple[str, ...] = ("단독/다가구", "연립다세대", "오피스텔")
PERIOD_START = "2023-09-01"
PERIOD_END = "2026-08-31"
MAX_AREA_M2 = 33
TARGET_DEPOSIT = 1000
RENT_BASIS = "adjusted_1000"
UNIT = "만원"

# 프로젝트 내 검증된 구군 중심좌표·출처·갱신시각이 없어 null로 반환한다.
DISTRICT_CENTERS: dict[str, tuple[float, float]] = {}
SOURCE_NAME: str | None = None
UPDATED_AT: str | None = None


class DistrictRentItem(BaseModel):
    """구군 중앙값 월세 항목."""

    region_code: str
    name: str
    center_latitude: float | None = None
    center_longitude: float | None = None
    median_rent: float | int | None = None
    sample_count: int = Field(..., ge=0)


class HousingMetadata(BaseModel):
    rent_basis: str = RENT_BASIS
    period_start: str = PERIOD_START
    period_end: str = PERIOD_END
    property_types: list[str] = Field(default_factory=lambda: list(PROPERTY_TYPES))
    max_area_m2: float | int = MAX_AREA_M2
    target_deposit: int = TARGET_DEPOSIT
    source_name: str | None = SOURCE_NAME
    updated_at: str | None = UPDATED_AT
    unit: str = UNIT


def build_housing_metadata() -> dict[str, Any]:
    return HousingMetadata().model_dump()
