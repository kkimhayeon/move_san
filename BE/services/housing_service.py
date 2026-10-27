"""주거(구별 월세/랭킹) 서비스."""

from typing import Any

from config import supabase


def list_district_rents() -> list[dict[str, Any]]:
    """임시: district_rent_test 테이블 조회. 이후 /api/housing/districts로 교체."""
    response = (
        supabase.table("district_rent_test")
        .select("region_code, region_name, median_rent")
        .execute()
    )
    return response.data or []


def list_districts() -> list[dict[str, Any]]:
    raise NotImplementedError("housing_service.list_districts 미구현")


def list_rankings() -> list[dict[str, Any]]:
    raise NotImplementedError("housing_service.list_rankings 미구현")
