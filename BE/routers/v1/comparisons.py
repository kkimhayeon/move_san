from flask import Blueprint, current_app, jsonify, request

from services.comparison_service import calculate_from_raw
from utils.money import INVALID_MONEY_MESSAGE, MoneyValidationError

comparisons_bp = Blueprint("comparisons", __name__, url_prefix="/api/v1")


@comparisons_bp.post("/comparisons")
def post_comparisons():
    """생활비 비교 계산. DB 저장 없음."""
    try:
        result = calculate_from_raw(request.get_data(cache=True, as_text=False) or b"")
    except MoneyValidationError:
        return jsonify({
            "status": 400,
            "message": INVALID_MONEY_MESSAGE,
            "result": None,
        }), 400
    except Exception:
        current_app.logger.exception("생활비 비교 계산 실패")
        return jsonify({
            "status": 500,
            "message": "서버 내부 오류가 발생했습니다.",
            "result": None,
        }), 500

    return jsonify({
        "status": 200,
        "message": "생활비 계산에 성공했습니다.",
        "result": result,
    })
