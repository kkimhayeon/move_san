from decimal import Decimal

from services.comparison_service import calculate_from_raw
from utils.money import MoneyValidationError, round_display


SPEC_EXAMPLE = {
    "seoul_pay": 300,
    "busan_pay": 250,
    "seoul_rent": 80,
    "busan_rent": 50,
    "living": 100,
}


def test_post_comparisons_success(client):
    res = client.post("/api/v1/comparisons", json=SPEC_EXAMPLE)
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert body["message"] == "생활비 계산에 성공했습니다."

    result = body["result"]
    assert result["input"] == SPEC_EXAMPLE
    assert result["seoul"] == {
        "pay": 300,
        "rent": 80,
        "living": 100,
        "monthly_remaining": 120,
        "annual_remaining": 1440,
    }
    assert result["busan"] == {
        "pay": 250,
        "rent": 50,
        "living": 94.9,
        "monthly_remaining": 105.1,
        "annual_remaining": 1261.2,
    }
    assert result["monthly_difference"] == -14.9
    assert result["annual_difference"] == -178.8
    assert result["differences"] == [
        {"item": "pay", "busan_minus_seoul": -50, "monthly_remaining_effect": -50},
        {"item": "rent", "busan_minus_seoul": -30, "monthly_remaining_effect": 30},
        {"item": "living", "busan_minus_seoul": -5.1, "monthly_remaining_effect": 5.1},
    ]
    assert result["largest_difference"] == {
        "items": ["pay"],
        "absolute_monthly_difference": 50,
    }
    assert result["living_ratio"] == 0.949
    assert result["unit"] == "만원"


def test_post_comparisons_missing_field(client):
    payload = {**SPEC_EXAMPLE}
    del payload["living"]
    res = client.post("/api/v1/comparisons", json=payload)
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == 400
    assert body["result"] is None


def test_post_comparisons_negative(client):
    res = client.post(
        "/api/v1/comparisons",
        json={**SPEC_EXAMPLE, "living": -1},
    )
    assert res.status_code == 400
    assert res.get_json()["result"] is None


def test_post_comparisons_string_number(client):
    res = client.post(
        "/api/v1/comparisons",
        data='{"seoul_pay":"300","busan_pay":250,"seoul_rent":80,"busan_rent":50,"living":100}',
        content_type="application/json",
    )
    assert res.status_code == 400


def test_post_comparisons_too_many_decimals(client):
    res = client.post(
        "/api/v1/comparisons",
        data=(
            '{"seoul_pay":300,"busan_pay":250,"seoul_rent":80,'
            '"busan_rent":50,"living":100.12345}'
        ),
        content_type="application/json",
    )
    assert res.status_code == 400


def test_post_comparisons_extra_field(client):
    res = client.post(
        "/api/v1/comparisons",
        json={**SPEC_EXAMPLE, "extra": 1},
    )
    assert res.status_code == 400


def test_largest_difference_all_zero():
    raw = (
        b'{"seoul_pay":0,"busan_pay":0,"seoul_rent":0,'
        b'"busan_rent":0,"living":0}'
    )
    result = calculate_from_raw(raw)
    assert result["largest_difference"]["items"] == []
    assert result["largest_difference"]["absolute_monthly_difference"] == 0


def test_largest_difference_tie_preserves_order():
    # pay effect abs=10, rent effect abs=10 → items [pay, rent]
    raw = (
        b'{"seoul_pay":100,"busan_pay":110,"seoul_rent":50,'
        b'"busan_rent":40,"living":0}'
    )
    result = calculate_from_raw(raw)
    assert result["largest_difference"]["items"] == ["pay", "rent"]
    assert result["largest_difference"]["absolute_monthly_difference"] == 10


def test_round_half_even():
    assert round_display(Decimal("1.25")) == Decimal("1.2")
    assert round_display(Decimal("1.35")) == Decimal("1.4")
    assert round_display(Decimal("-1.25")) == Decimal("-1.2")


def test_calculate_from_raw_rejects_boolean():
    raw = (
        b'{"seoul_pay":true,"busan_pay":250,"seoul_rent":80,'
        b'"busan_rent":50,"living":100}'
    )
    try:
        calculate_from_raw(raw)
        assert False, "expected MoneyValidationError"
    except MoneyValidationError:
        pass
