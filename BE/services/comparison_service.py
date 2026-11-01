"""생활비 비교 계산 서비스. DB 저장 없음."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from utils.money import (
    INVALID_MONEY_MESSAGE,
    MoneyValidationError,
    parse_json_object,
    parse_money_value,
    round_display,
    to_json_number,
)

LIVING_RATIO = Decimal("0.949")
REQUIRED_FIELDS = (
    "seoul_pay",
    "busan_pay",
    "seoul_rent",
    "busan_rent",
    "living",
)
ITEM_ORDER = ("pay", "rent", "living")


def _city_amounts(
    *,
    pay: Decimal,
    rent: Decimal,
    living: Decimal,
    monthly_remaining: Decimal,
) -> dict[str, int | float]:
    annual = monthly_remaining * Decimal("12")
    return {
        "pay": to_json_number(round_display(pay)),
        "rent": to_json_number(round_display(rent)),
        "living": to_json_number(round_display(living)),
        "monthly_remaining": to_json_number(round_display(monthly_remaining)),
        "annual_remaining": to_json_number(round_display(annual)),
    }


def _parse_input(raw_body: bytes | str) -> dict[str, Decimal]:
    data = parse_json_object(raw_body)
    missing = set(REQUIRED_FIELDS) - set(data.keys())
    extra = set(data.keys()) - set(REQUIRED_FIELDS)
    if missing or extra:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)

    return {field: parse_money_value(data[field], field=field) for field in REQUIRED_FIELDS}


def calculate_from_raw(raw_body: bytes | str) -> dict[str, Any]:
    """요청 원문으로 생활비 비교 결과 계산."""
    amounts = _parse_input(raw_body)

    seoul_pay = amounts["seoul_pay"]
    busan_pay = amounts["busan_pay"]
    seoul_rent = amounts["seoul_rent"]
    busan_rent = amounts["busan_rent"]
    living = amounts["living"]

    seoul_living = living
    busan_living = living * LIVING_RATIO

    seoul_monthly = seoul_pay - seoul_rent - seoul_living
    busan_monthly = busan_pay - busan_rent - busan_living

    monthly_difference = busan_monthly - seoul_monthly
    annual_difference = monthly_difference * Decimal("12")

    # differences (반올림 전 값으로 효과·최대 차이 선정)
    pay_delta = busan_pay - seoul_pay
    rent_delta = busan_rent - seoul_rent
    living_delta = busan_living - seoul_living

    effects = {
        "pay": pay_delta,  # 월급: 부산-서울
        "rent": -rent_delta,  # 지출: 서울-부산
        "living": -living_delta,
    }
    deltas = {
        "pay": pay_delta,
        "rent": rent_delta,
        "living": living_delta,
    }

    differences = [
        {
            "item": item,
            "busan_minus_seoul": to_json_number(round_display(deltas[item])),
            "monthly_remaining_effect": to_json_number(round_display(effects[item])),
        }
        for item in ITEM_ORDER
    ]

    abs_effects = {item: abs(effects[item]) for item in ITEM_ORDER}
    max_abs = max(abs_effects.values())
    if max_abs == 0:
        largest_items: list[str] = []
        largest_abs = Decimal("0")
    else:
        largest_items = [item for item in ITEM_ORDER if abs_effects[item] == max_abs]
        largest_abs = max_abs

    return {
        "input": {field: to_json_number(amounts[field]) for field in REQUIRED_FIELDS},
        "seoul": _city_amounts(
            pay=seoul_pay,
            rent=seoul_rent,
            living=seoul_living,
            monthly_remaining=seoul_monthly,
        ),
        "busan": _city_amounts(
            pay=busan_pay,
            rent=busan_rent,
            living=busan_living,
            monthly_remaining=busan_monthly,
        ),
        "monthly_difference": to_json_number(round_display(monthly_difference)),
        "annual_difference": to_json_number(round_display(annual_difference)),
        "differences": differences,
        "largest_difference": {
            "items": largest_items,
            "absolute_monthly_difference": to_json_number(round_display(largest_abs)),
        },
        "living_ratio": float(LIVING_RATIO),
        "unit": "만원",
    }


def calculate(payload: dict[str, Any]) -> dict[str, Any]:
    """dict 입력이 필요할 때용. 원문 검증이 필요하면 calculate_from_raw 사용."""
    import json

    return calculate_from_raw(json.dumps(payload))
