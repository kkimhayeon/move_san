from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from services.upload_service import (
    UploadConfigError,
    UploadQueryError,
    UploadValidationError,
    upload_image,
)
from utils.auth import get_current_user, require_auth

uploads_bp = Blueprint("uploads", __name__, url_prefix="/api/v1")

INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


@uploads_bp.post("/uploads/images")
@require_auth
def post_upload_image():
    user = get_current_user()
    assert user is not None

    file = request.files.get("file")
    if file is None:
        return _error(
            400,
            "multipart/form-data의 file이 누락되었거나 파일이 비어 있거나 손상되었습니다.",
        )

    file_bytes = file.read()
    try:
        result = upload_image(
            owner_id=user["user_id"],
            file_bytes=file_bytes,
            filename_hint=file.filename,
        )
    except UploadValidationError as exc:
        return _error(exc.status, exc.message)
    except UploadConfigError:
        current_app.logger.error("SUPABASE_SECRET_KEY 미설정으로 업로드 불가")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except UploadQueryError:
        current_app.logger.exception("사진 업로드 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("사진 업로드 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 201,
        "message": "사진 업로드에 성공했습니다.",
        "result": result,
    }), 201
