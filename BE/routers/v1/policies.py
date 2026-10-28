from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from schemas.policy_schema import (
    INTERNAL_ERROR_MESSAGE,
    PolicyValidationError,
    parse_category_filter,
    parse_q_filter,
)
from services import policy_service
from services.policy_service import PolicyQueryError

# 혜택 공개 조회는 /api (v1 경로를 새로 두지 않음)
policies_bp = Blueprint("policies", __name__, url_prefix="/api")

# 즐겨찾기 스텁은 기존 명세 경로(/api/v1) 유지
policy_favorites_bp = Blueprint("policy_favorites", __name__, url_prefix="/api/v1")


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


@policies_bp.get("/policies")
def get_policies():
    try:
        category = parse_category_filter(request.args.get("category"))
        q = parse_q_filter(request.args.get("q"))
        result = policy_service.list_policies(category=category, q=q)
    except PolicyValidationError as exc:
        return _error(400, exc.message)
    except PolicyQueryError:
        current_app.logger.exception("혜택 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("혜택 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "혜택 목록 조회에 성공했습니다.",
        "result": result,
    })


@policies_bp.get("/policies/categories")
def get_policy_categories():
    try:
        result = policy_service.list_categories()
    except Exception:
        current_app.logger.exception("혜택 카테고리 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "혜택 카테고리 조회에 성공했습니다.",
        "result": result,
    })


@policy_favorites_bp.put("/policies/<policy_id>/favorite")
def add_favorite(policy_id: str):
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@policy_favorites_bp.delete("/policies/<policy_id>/favorite")
def remove_favorite(policy_id: str):
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
