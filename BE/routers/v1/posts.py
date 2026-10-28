from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from schemas.post_schema import (
    COMMENT_INPUT_MESSAGE,
    COMMENT_PAGE_MESSAGE,
    PAGE_OR_Q_MESSAGE,
    POST_INPUT_MESSAGE,
    POST_UUID_MESSAGE,
    CommunityValidationError,
    parse_comment_create,
    parse_page_params,
    parse_post_create,
    parse_uuid,
)
from services import comment_service, post_service
from services.comment_service import CommentQueryError
from services.post_service import (
    CategoryNotFoundError,
    ImageAttachError,
    PostNotFoundError,
    PostForbiddenError,
    PostQueryError,
    ProfileMissingError,
)
from utils.auth import get_current_user, optional_auth, require_auth

posts_bp = Blueprint("posts", __name__, url_prefix="/api/v1")

INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."
PROFILE_MISSING_MESSAGE = "회원 프로필이 생성되지 않았습니다."


def _error(status: int, message: str):
    return jsonify({"status": status, "message": message, "result": None}), status


def _viewer_id() -> str | None:
    user = get_current_user()
    if not user:
        return None
    return user.get("user_id")


@posts_bp.get("/posts/categories")
def get_post_categories():
    try:
        result = post_service.list_categories()
    except PostQueryError:
        current_app.logger.exception("카테고리 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("카테고리 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "카테고리 조회에 성공했습니다.",
        "result": result,
    })


@posts_bp.get("/posts")
@optional_auth
def get_posts():
    try:
        page, page_size, q, category_code = parse_page_params(
            request.args,
            page_message=PAGE_OR_Q_MESSAGE,
            allow_q=True,
            allow_category=True,
        )
        result = post_service.list_posts(
            page=page,
            page_size=page_size,
            q=q,
            category_code=category_code,
            viewer_id=_viewer_id(),
        )
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except CategoryNotFoundError:
        return _error(400, PAGE_OR_Q_MESSAGE)
    except PostQueryError:
        current_app.logger.exception("글 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("글 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "공개 목록 검색에 성공했습니다.",
        "result": result,
    })


@posts_bp.post("/posts")
@require_auth
def create_post():
    user = get_current_user()
    assert user is not None

    try:
        payload = parse_post_create(request.get_data(cache=True, as_text=False) or b"")
        result = post_service.create_post(
            author_id=user["user_id"],
            title=payload.title,
            content=payload.content,
            category_code=payload.category_code,
            image_ids=payload.image_ids,
        )
    except CommunityValidationError:
        return _error(400, POST_INPUT_MESSAGE)
    except CategoryNotFoundError:
        return _error(400, POST_INPUT_MESSAGE)
    except ImageAttachError:
        return _error(400, POST_INPUT_MESSAGE)
    except ProfileMissingError:
        return _error(404, PROFILE_MISSING_MESSAGE)
    except PostQueryError:
        current_app.logger.exception("글 작성 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("글 작성 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 201,
        "message": "글 작성에 성공했습니다.",
        "result": result,
    }), 201


@posts_bp.get("/posts/<post_id>")
@optional_auth
def get_post(post_id: str):
    try:
        post_uuid = parse_uuid(post_id, message=POST_UUID_MESSAGE)
        result = post_service.get_post(post_uuid, _viewer_id())
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except PostNotFoundError:
        return _error(404, "게시글이 없거나 삭제되었습니다.")
    except PostQueryError:
        current_app.logger.exception("글 상세 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("글 상세 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "공개 글 상세에 성공했습니다.",
        "result": result,
    })


@posts_bp.delete("/posts/<post_id>")
@require_auth
def delete_post(post_id: str):
    user = get_current_user()
    assert user is not None

    try:
        post_uuid = parse_uuid(post_id, message=POST_UUID_MESSAGE)
        post_service.delete_post(post_id=post_uuid, author_id=user["user_id"])
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except PostForbiddenError:
        return _error(403, "본인이 작성한 게시글만 삭제할 수 있습니다.")
    except PostNotFoundError:
        return _error(404, "게시글이 없거나 삭제되었습니다.")
    except PostQueryError:
        current_app.logger.exception("글 삭제 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("글 삭제 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "글 삭제에 성공했습니다.",
        "result": None,
    })


@posts_bp.get("/posts/<post_id>/comments")
@optional_auth
def get_post_comments(post_id: str):
    try:
        post_uuid = parse_uuid(post_id, message=COMMENT_PAGE_MESSAGE)
        page, page_size, _, _ = parse_page_params(
            request.args, page_message=COMMENT_PAGE_MESSAGE, allow_q=False
        )
        result = comment_service.list_comments(
            post_id=post_uuid,
            page=page,
            page_size=page_size,
            viewer_id=_viewer_id(),
        )
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except PostNotFoundError:
        return _error(404, "게시글이 없거나 삭제되었습니다.")
    except (PostQueryError, CommentQueryError):
        current_app.logger.exception("댓글 목록 조회 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("댓글 목록 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 200,
        "message": "공개 댓글 목록에 성공했습니다.",
        "result": result,
    })


@posts_bp.post("/posts/<post_id>/comments")
@require_auth
def create_post_comment(post_id: str):
    user = get_current_user()
    assert user is not None

    try:
        post_uuid = parse_uuid(post_id, message=COMMENT_INPUT_MESSAGE)
        payload = parse_comment_create(request.get_data(cache=True, as_text=False) or b"")
        result = comment_service.create_comment(
            post_id=post_uuid,
            author_id=user["user_id"],
            content=payload.content,
        )
    except CommunityValidationError as exc:
        return _error(400, exc.message)
    except ProfileMissingError:
        return _error(404, PROFILE_MISSING_MESSAGE)
    except PostNotFoundError:
        return _error(404, "게시글이 없거나 삭제되었습니다.")
    except (PostQueryError, CommentQueryError):
        current_app.logger.exception("댓글 작성 실패")
        return _error(500, INTERNAL_ERROR_MESSAGE)
    except Exception:
        current_app.logger.exception("댓글 작성 처리 중 오류")
        return _error(500, INTERNAL_ERROR_MESSAGE)

    return jsonify({
        "status": 201,
        "message": "댓글 작성에 성공했습니다.",
        "result": result,
    }), 201
