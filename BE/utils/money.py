"""금액(만원) JSON number → Decimal 검증·표시 반올림."""

from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_EVEN
from typing import Any

MAX_DECIMAL_PLACES = 4
DISPLAY_QUANTUM = Decimal("0.1")

INVALID_MONEY_MESSAGE = "필수 금액 누락, 숫자 아닌 값, 음수 또는 소수 4자리 초과입니다."


class MoneyValidationError(ValueError):
    """금액 필드 검증 실패."""


def round_display(value: Decimal) -> Decimal:
    """표시 금액: ROUND_HALF_EVEN 소수 1자리. -0은 0."""
    rounded = value.quantize(DISPLAY_QUANTUM, rounding=ROUND_HALF_EVEN)
    if rounded == 0:
        return Decimal("0")
    return rounded


def to_json_number(value: Decimal) -> int | float:
    """API JSON number. 정수면 int, 아니면 float. -0 → 0."""
    if value == 0:
        return 0
    normalized = value.normalize()
    if normalized == normalized.to_integral_value():
        return int(normalized)
    return float(value)


def decimal_places(value: Decimal) -> int:
    """뒤쪽 0 제거 후 소수 자릿수."""
    normalized = value.normalize()
    if normalized == normalized.to_integral_value():
        return 0
    exponent = normalized.as_tuple().exponent
    if not isinstance(exponent, int):
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    return max(0, -exponent)


def parse_money_value(raw: Any, *, field: str) -> Decimal:
    """JSON 원문에서 파싱된 값이 유한한 0 이상 number이고 소수 ≤4자리인지 검증."""
    if isinstance(raw, bool) or raw is None:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    if isinstance(raw, str):
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    if not isinstance(raw, (int, float, Decimal)):
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)

    try:
        value = raw if isinstance(raw, Decimal) else Decimal(str(raw))
    except (InvalidOperation, ValueError) as exc:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE) from exc

    if not value.is_finite():
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    if value < 0:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    if decimal_places(value) > MAX_DECIMAL_PLACES:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    return value


def parse_json_object(raw_body: bytes | str) -> dict[str, Any]:
    """요청 본문을 객체로 파싱. float는 Decimal로 유지."""
    if isinstance(raw_body, bytes):
        text = raw_body.decode("utf-8")
    else:
        text = raw_body

    if not text or not text.strip():
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)

    try:
        data = json.loads(
            text,
            parse_float=Decimal,
            parse_int=Decimal,
            parse_constant=lambda _c: (_ for _ in ()).throw(
                MoneyValidationError(INVALID_MONEY_MESSAGE)
            ),
        )
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise MoneyValidationError(INVALID_MONEY_MESSAGE) from exc

    if not isinstance(data, dict):
        raise MoneyValidationError(INVALID_MONEY_MESSAGE)
    return data
