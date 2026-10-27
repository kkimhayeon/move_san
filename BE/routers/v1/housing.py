from __future__ import annotations

import re

from flask import Blueprint, current_app, jsonify, request

from services import housing_service
from services.housing_service import (
    HousingDataUnavailableError,
    HousingQueryError,
)

housing_bp = Blueprint("housing", __name__, url_prefix="/api/v1")

LIMIT_ERROR_MESSAGE = "limit은 1부터 5까지의 정수여야 합니다."
UNAVAILABLE_MESSAGE = "지도 집계 기준 또는 데이터가 준비되지 않았습니다."
INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."
_LIMIT_PATTERN = re.compile(r"^[1-5]$")


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


def parse_rankings_limit() -> int:
    """limit 생략 시 5. 그 외는 문자열 그대로 1~5 정수만 허용."""
    if "limit" not in request.args:
        return 5
    raw = request.args.get("limit")
    if raw is None or not _LIMIT_PATTERN.fullmatch(raw):
        raise ValueError(LIMIT_ERROR_MESSAGE)
    return int(raw)


@housing_bp.get("/rent")
def get_rent():
    """임시 월세 조회. district_rent_test 전용. 지도 API와 별개."""
    try:
        data = housing_service.list_district_rents()
        return jsonify({
            "status": "success",
            "data": data,
        })
    except Exception:
        current_app.logger.exception("Supabase 월세 조회 실패")
        return jsonify({
            "status": "error",
            "message": "월세 데이터를 조회하지 못했습니다.",
        }), 500


@housing_bp.get("/housing/districts")
def get_districts():
    try:
        result = housing_service.list_districts()
    except HousingDataUnavailableError:
        return _error(503, UNAVAILABLE_MESSAGE)
    except HousingQueryError:
        current_app.logger.exception("구군별 중앙값 월세 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("구군별 중앙값 월세 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "구군별 중앙값 월세에 성공했습니다.",
        "result": result,
    })


@housing_bp.get("/housing/rankings")
def get_rankings():
    try:
        limit = parse_rankings_limit()
    except ValueError:
        return _error(400, LIMIT_ERROR_MESSAGE)

    try:
        result = housing_service.list_rankings(limit)
    except HousingDataUnavailableError:
        return _error(503, UNAVAILABLE_MESSAGE)
    except HousingQueryError:
        current_app.logger.exception("저렴한 구군 TOP 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("저렴한 구군 TOP 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "저렴한 구군 TOP 5에 성공했습니다.",
        "result": result,
    })
