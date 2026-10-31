from __future__ import annotations

from flask import Blueprint, current_app, jsonify

from schemas.post_schema import (
    COMMENT_UUID_MESSAGE,
    CommunityValidationError,
    parse_uuid,
)
from services import comment_service
from services.comment_service import (
    CommentForbiddenError,
    CommentNotFoundError,
    CommentQueryError,
)
from utils.auth import get_current_user, require_auth

comments_bp = Blueprint("comments", __name__, url_prefix="/api/v1")

INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


@comments_bp.delete("/comments/<comment_id>")
@require_auth
def delete_comment(comment_id: str):
    user = get_current_user()
    assert user is not None

    try:
        comment_uuid = parse_uuid(comment_id, message=COMMENT_UUID_MESSAGE)
        comment_service.delete_comment(
            comment_id=comment_uuid,
            author_id=user["user_id"],
        )
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except CommentForbiddenError:
        return _error(403, "본인이 작성한 댓글만 삭제할 수 있습니다.")
    except CommentNotFoundError:
        return _error(404, "댓글이 없거나 이미 삭제되었습니다.")
    except CommentQueryError:
        current_app.logger.exception("댓글 삭제 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("댓글 삭제 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "댓글 삭제에 성공했습니다.",
        "result": None,
    })
