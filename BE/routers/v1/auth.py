from flask import Blueprint, jsonify

from services.auth_service import AuthError, verify_token
from utils.auth import AUTH_REQUIRED_MESSAGE, get_bearer_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.get("/verify")
def verify():
    """
    FE에서 받은 Supabase access token을 Flask가 검증한다.
    Authorization: Bearer <access_token>
    """
    token = get_bearer_token()
    if not token:
        return jsonify({
            "status": 401,
            "message": AUTH_REQUIRED_MESSAGE,
            "result": None,
        }), 401

    try:
        user = verify_token(token)
    except AuthError:
        return jsonify({
            "status": 401,
            "message": AUTH_REQUIRED_MESSAGE,
            "result": None,
        }), 401

    return jsonify({
        "status": 200,
        "message": "토큰 검증에 성공했습니다.",
        "result": {
            "user_id": user["user_id"],
            "email": user.get("email"),
        },
    })
