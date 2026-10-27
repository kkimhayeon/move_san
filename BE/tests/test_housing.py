from __future__ import annotations

from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from services.housing_service import (
    HousingDataUnavailableError,
    list_districts,
    list_rankings,
)

# 검증된 TOP 5 + 나머지 구군(단위 테스트용). sample_count 합계 103505.
SAMPLE_ROWS = [
    {"region_code": "26410", "name": "금정구", "median_rent": "30.0000", "sample_count": 7943},
    {"region_code": "26200", "name": "영도구", "median_rent": "30.6250", "sample_count": 1181},
    {"region_code": "26710", "name": "기장군", "median_rent": "33.4125", "sample_count": 2405},
    {"region_code": "26380", "name": "사하구", "median_rent": "35.0000", "sample_count": 5198},
    {"region_code": "26320", "name": "북구", "median_rent": "35.3917", "sample_count": 2339},
    {"region_code": "26110", "name": "중구", "median_rent": "40.0000", "sample_count": 1000},
    {"region_code": "26140", "name": "서구", "median_rent": "41.0000", "sample_count": 2000},
    {"region_code": "26170", "name": "동구", "median_rent": "42.0000", "sample_count": 3000},
    {"region_code": "26230", "name": "부산진구", "median_rent": "43.0000", "sample_count": 8000},
    {"region_code": "26260", "name": "동래구", "median_rent": "44.0000", "sample_count": 7000},
    {"region_code": "26290", "name": "남구", "median_rent": "45.0000", "sample_count": 9000},
    {"region_code": "26350", "name": "해운대구", "median_rent": "46.0000", "sample_count": 15000},
    {"region_code": "26440", "name": "강서구", "median_rent": "47.0000", "sample_count": 6000},
    {"region_code": "26470", "name": "연제구", "median_rent": "48.0000", "sample_count": 11000},
    {"region_code": "26500", "name": "수영구", "median_rent": "49.0000", "sample_count": 12000},
    {"region_code": "26530", "name": "사상구", "median_rent": "50.0000", "sample_count": 10439},
]

EXPECTED_TOP5 = [
    ("금정구", "26410", 30, 7943),
    ("영도구", "26200", 30.625, 1181),
    ("기장군", "26710", 33.4125, 2405),
    ("사하구", "26380", 35, 5198),
    ("북구", "26320", 35.3917, 2339),
]


def _mock_rpc(data):
    mock_sb = MagicMock()
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=data)
    return mock_sb


def test_sample_rows_sum_and_count():
    assert len(SAMPLE_ROWS) == 16
    assert sum(r["sample_count"] for r in SAMPLE_ROWS) == 103505


@patch("services.housing_service.supabase")
def test_list_districts_sort_and_metadata(mock_sb):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    result = list_districts()
    names = [item["name"] for item in result["items"]]
    assert names == sorted(names)
    assert len(result["items"]) == 16
    assert sum(i["sample_count"] for i in result["items"]) == 103505

    meta = result["metadata"]
    assert meta["rent_basis"] == "adjusted_1000"
    assert meta["period_start"] == "2023-09-01"
    assert meta["period_end"] == "2026-08-31"
    assert meta["property_types"] == ["단독/다가구", "연립다세대", "오피스텔"]
    assert meta["max_area_m2"] == 33
    assert meta["target_deposit"] == 1000
    assert meta["unit"] == "만원"
    assert meta["source_name"] is None
    assert meta["updated_at"] is None
    assert result["items"][0]["center_latitude"] is None
    assert result["items"][0]["center_longitude"] is None


@patch("services.housing_service.supabase")
def test_list_rankings_top5(mock_sb):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    result = list_rankings(5)
    items = result["items"]
    assert len(items) == 5
    for item, expected in zip(items, EXPECTED_TOP5):
        name, code, median, sample = expected
        assert item["name"] == name
        assert item["region_code"] == code
        assert item["median_rent"] == median
        assert item["sample_count"] == sample


@patch("services.housing_service.supabase")
def test_list_rankings_limit_1(mock_sb):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    result = list_rankings(1)
    assert len(result["items"]) == 1
    assert result["items"][0]["region_code"] == "26410"


@patch("services.housing_service.supabase")
def test_list_rankings_excludes_null_median_and_tie_break(mock_sb):
    rows = [
        {"region_code": "26200", "name": "영도구", "median_rent": "30.0000", "sample_count": 1},
        {"region_code": "26410", "name": "금정구", "median_rent": "30.0000", "sample_count": 2},
        {"region_code": "26710", "name": "기장군", "median_rent": None, "sample_count": 0},
    ]
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=rows)
    result = list_rankings(5)
    codes = [i["region_code"] for i in result["items"]]
    assert codes == ["26200", "26410"]


@patch("services.housing_service.supabase")
def test_empty_rows_raise_503(mock_sb):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=[])
    with pytest.raises(HousingDataUnavailableError):
        list_districts()


@patch("services.housing_service.supabase")
def test_districts_route_success(mock_sb, client):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    res = client.get("/api/v1/housing/districts")
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert body["message"] == "구군별 중앙값 월세에 성공했습니다."
    assert len(body["result"]["items"]) == 16


@patch("services.housing_service.supabase")
def test_rankings_route_default_limit(mock_sb, client):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    res = client.get("/api/v1/housing/rankings")
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert len(body["result"]["items"]) == 5
    assert body["result"]["items"][0]["region_code"] == "26410"


@patch("services.housing_service.supabase")
def test_rankings_route_limit_1(mock_sb, client):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    res = client.get("/api/v1/housing/rankings?limit=1")
    assert res.status_code == 200
    assert len(res.get_json()["result"]["items"]) == 1


@pytest.mark.parametrize("limit", ["0", "6", "1.5", "abc", "", "01", "-1", "5.0"])
def test_rankings_invalid_limit(client, limit):
    res = client.get(f"/api/v1/housing/rankings?limit={limit}")
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == 400
    assert body["message"] == "limit은 1부터 5까지의 정수여야 합니다."
    assert body["result"] is None


@patch("services.housing_service.supabase")
def test_districts_503_when_empty(mock_sb, client):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=[])
    res = client.get("/api/v1/housing/districts")
    assert res.status_code == 503
    body = res.get_json()
    assert body["status"] == 503
    assert body["result"] is None


@patch("services.housing_service.supabase")
def test_districts_500_when_rpc_fails(mock_sb, client):
    mock_sb.rpc.return_value.execute.side_effect = RuntimeError("db down")
    res = client.get("/api/v1/housing/districts")
    assert res.status_code == 500
    body = res.get_json()
    assert body["status"] == 500
    assert body["result"] is None
    assert "db down" not in body["message"]


@patch("services.housing_service.supabase")
def test_same_district_values_match_across_apis(mock_sb):
    mock_sb.rpc.return_value.execute.return_value = MagicMock(data=SAMPLE_ROWS)
    districts = {i["region_code"]: i for i in list_districts()["items"]}
    rankings = list_rankings(5)["items"]
    for item in rankings:
        d = districts[item["region_code"]]
        assert item["median_rent"] == d["median_rent"]
        assert item["sample_count"] == d["sample_count"]


def test_median_sort_uses_numeric_not_string():
    # "100" < "30" as strings; numeric sort must put 30 first.
    rows = [
        {"region_code": "A", "name": "A", "median_rent": Decimal("100"), "sample_count": 1},
        {"region_code": "B", "name": "B", "median_rent": Decimal("30"), "sample_count": 1},
    ]
    ranked = sorted(
        [r for r in rows if r["median_rent"] is not None],
        key=lambda r: (r["median_rent"], r["region_code"]),
    )
    assert ranked[0]["region_code"] == "B"
