from flask import Blueprint, current_app, jsonify

from services.user_service import ProfileNotFoundError, get_me
from utils.auth import get_current_user, require_auth

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.get("/me")
@require_auth
def get_users_me():
    """JWT sub와 동일한 id의 profiles 조회."""
    user = get_current_user()
    assert user is not None

    try:
        profile = get_me(user["user_id"])
    except ProfileNotFoundError:
        return jsonify({
            "status": 404,
            "message": "회원 프로필이 생성되지 않았습니다.",
            "result": None,
        }), 404
    except Exception:
        current_app.logger.exception("프로필 조회 실패")
        return jsonify({
            "status": 500,
            "message": "서버 내부 오류가 발생했습니다.",
            "result": None,
        }), 500

    return jsonify({
        "status": 200,
        "message": "프로필 조회에 성공했습니다.",
        "result": profile,
    })


@users_bp.patch("/me")
@require_auth
def patch_users_me():
    return jsonify({
        "status": 501,
        "message": "미구현",
        "result": None,
    }), 501
