"""혜택(support_policies) 조회용 상수·검증·응답 매핑."""

from __future__ import annotations

from typing import Any

# 화면 ‘혜택’ 카테고리. 목록 필터와 categories API가 동일 상수를 사용한다.
POLICY_CATEGORIES: tuple[str, ...] = (
    "정책",
    "금융상품",
    "문화 및 모임 활동",
)

INVALID_CATEGORY_MESSAGE = "카테고리 값이 올바르지 않습니다."
INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."

POLICY_LIST_SELECT = (
    "policy_id, policy_name, category, description, benefit_description, "
    "period_description, eligibility_description, interest_rate_description, "
    "official_url"
)


class PolicyValidationError(ValueError):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def normalize_optional_query(raw: str | None) -> str | None:
    """없거나 공백뿐이면 None(필터 생략). 그 외 strip한 문자열."""
    if raw is None:
        return None
    text = str(raw).strip()
    return text or None


def parse_category_filter(raw: str | None) -> str | None:
    """category 쿼리 검증. 빈/공백은 생략, 허용값만 통과."""
    value = normalize_optional_query(raw)
    if value is None:
        return None
    if value not in POLICY_CATEGORIES:
        raise PolicyValidationError(INVALID_CATEGORY_MESSAGE)
    return value


def parse_q_filter(raw: str | None) -> str | None:
    return normalize_optional_query(raw)


def serialize_policy_item(row: dict[str, Any]) -> dict[str, Any]:
    """DB 행 → API 항목. nullable은 JSON null 유지. 금액·금리 숫자 변환 없음."""
    return {
        "policy_id": row["policy_id"],
        "policy_name": row["policy_name"],
        "category": row["category"],
        "description": row["description"],
        "benefit_description": row.get("benefit_description"),
        "period_description": row.get("period_description"),
        "eligibility_description": row.get("eligibility_description"),
        "interest_rate_description": row.get("interest_rate_description"),
        "official_url": row.get("official_url"),
    }


def categories_payload() -> dict[str, list[str]]:
    return {"categories": list(POLICY_CATEGORIES)}
