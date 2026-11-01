"""주거(구별 월세/랭킹) 서비스. DB 집계는 Supabase RPC에서 수행."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_EVEN
from typing import Any

from config import supabase
from schemas.housing_schema import (
    DISTRICT_CENTERS,
    build_housing_metadata,
)
from utils.money import to_json_number

_INTEGER = Decimal("1")


def _round_to_int(value: Decimal) -> Decimal:
    """소수 첫째 자리 기준 ROUND_HALF_EVEN → 정수."""
    rounded = value.quantize(_INTEGER, rounding=ROUND_HALF_EVEN)
    if rounded == 0:
        return Decimal("0")
    return rounded

RPC_NAME = "get_housing_district_medians"


class HousingDataUnavailableError(Exception):
    """집계 대상 행이 없음 (HTTP 503)."""


class HousingQueryError(Exception):
    """RPC/DB 호출 실패 (HTTP 500)."""


def list_district_rents() -> list[dict[str, Any]]:
    """임시: district_rent_test 테이블 조회. 지도 API와 무관."""
    response = (
        supabase.table("district_rent_test")
        .select("region_code, region_name, median_rent")
        .execute()
    )
    return response.data or []


def _to_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise HousingQueryError("median_rent 형식이 올바르지 않습니다.") from exc


def _normalize_row(raw: dict[str, Any]) -> dict[str, Any]:
    region_code = raw.get("region_code")
    name = raw.get("name")
    if region_code is None or name is None:
        raise HousingQueryError("집계 행에 region_code/name이 없습니다.")

    code = str(region_code)
    median = _to_decimal(raw.get("median_rent"))
    sample_raw = raw.get("sample_count")
    try:
        sample_count = int(sample_raw)
    except (TypeError, ValueError) as exc:
        raise HousingQueryError("sample_count 형식이 올바르지 않습니다.") from exc

    center = DISTRICT_CENTERS.get(code)
    return {
        "region_code": code,
        "name": str(name),
        "center_latitude": center[0] if center else None,
        "center_longitude": center[1] if center else None,
        "median_rent": median,
        "sample_count": sample_count,
    }


def _serialize_item(row: dict[str, Any]) -> dict[str, Any]:
    median: Decimal | None = row["median_rent"]
    # DB 중앙값은 소수 4자리 원값. 응답은 소수 첫째 자리 기준 반올림한 정수.
    return {
        "region_code": row["region_code"],
        "name": row["name"],
        "center_latitude": row["center_latitude"],
        "center_longitude": row["center_longitude"],
        "median_rent": (
            to_json_number(_round_to_int(median)) if median is not None else None
        ),
        "sample_count": row["sample_count"],
    }


def _build_result(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "metadata": build_housing_metadata(),
        "items": [_serialize_item(row) for row in rows],
    }


def _fetch_aggregated_rows() -> list[dict[str, Any]]:
    try:
        response = supabase.rpc(RPC_NAME).execute()
    except Exception as exc:
        raise HousingQueryError("구군 월세 집계 조회에 실패했습니다.") from exc

    data = response.data
    if data is None:
        raise HousingDataUnavailableError()
    if not isinstance(data, list):
        raise HousingQueryError("집계 응답 형식이 올바르지 않습니다.")
    if len(data) == 0:
        raise HousingDataUnavailableError()

    return [_normalize_row(row) for row in data]


def list_districts() -> dict[str, Any]:
    """구군별 중앙값 월세. 이름·region_code 오름차순."""
    rows = _fetch_aggregated_rows()
    rows.sort(key=lambda r: (r["name"], r["region_code"]))
    return _build_result(rows)


def list_rankings(limit: int) -> dict[str, Any]:
    """저렴한 구군 TOP N. median_rent null 제외 후 오름차순, 동률 region_code."""
    rows = _fetch_aggregated_rows()
    ranked = [r for r in rows if r["median_rent"] is not None]
    ranked.sort(key=lambda r: (r["median_rent"], r["region_code"]))
    return _build_result(ranked[:limit])
