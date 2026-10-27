from flask import Blueprint, current_app, jsonify

from services import housing_service

housing_bp = Blueprint("housing", __name__, url_prefix="/api/v1")


@housing_bp.get("/rent")
def get_rent():
    """임시 월세 조회. 명세의 /api/housing/districts로 대체 예정."""
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
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501


@housing_bp.get("/housing/rankings")
def get_rankings():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
