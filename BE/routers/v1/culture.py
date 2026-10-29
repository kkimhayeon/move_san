from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from schemas.culture_schema import (
    INTERNAL_ERROR_MESSAGE,
    CultureValidationError,
    parse_article_list_params,
    parse_event_list_params,
    parse_place_list_params,
)
from services import culture_service
from services.culture_service import CultureQueryError

# 컬처 공개 조회는 /api (policies와 동일하게 v1 경로를 새로 두지 않음)
culture_bp = Blueprint("culture", __name__, url_prefix="/api")


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


@culture_bp.get("/culture/events")
def get_culture_events():
    try:
        params = parse_event_list_params(request.args)
        result = culture_service.list_events(**params)
    except CultureValidationError as exc:
        return _error(400, exc.message)
    except CultureQueryError:
        current_app.logger.exception("컬처 행사 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("컬처 행사 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "컬처 행사 목록 조회에 성공했습니다.",
        "result": result,
    })


@culture_bp.get("/culture/places")
def get_culture_places():
    try:
        params = parse_place_list_params(request.args)
        result = culture_service.list_places(**params)
    except CultureValidationError as exc:
        return _error(400, exc.message)
    except CultureQueryError:
        current_app.logger.exception("컬처 공간 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("컬처 공간 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "컬처 공간 목록 조회에 성공했습니다.",
        "result": result,
    })


@culture_bp.get("/culture/articles")
def get_culture_articles():
    try:
        params = parse_article_list_params(request.args)
        result = culture_service.list_articles(**params)
    except CultureValidationError as exc:
        return _error(400, exc.message)
    except CultureQueryError:
        current_app.logger.exception("컬처 글 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("컬처 글 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "컬처 글 목록 조회에 성공했습니다.",
        "result": result,
    })
