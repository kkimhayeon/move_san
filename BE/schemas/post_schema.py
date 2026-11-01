"""커뮤니티 글/댓글 입력 검증 및 표시용 매핑."""

from __future__ import annotations

import json
import uuid
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

DEFAULT_NICKNAME = "사용자"
MAX_IMAGES_PER_POST = 5

POST_INPUT_MESSAGE = (
    "제목·내용·카테고리 또는 사진 정보가 올바르지 않습니다. "
    "없는 카테고리, 없는 사진, 타인 사진, 이미 연결한 사진은 허용하지 않습니다."
)
COMMENT_INPUT_MESSAGE = "게시글 ID가 올바르지 않거나 댓글이 공백 제거 후 1~1000자가 아닙니다."
PAGE_OR_Q_MESSAGE = "페이지 범위, 검색어 길이 또는 카테고리 코드가 올바르지 않습니다."
COMMENT_PAGE_MESSAGE = "게시글 ID 또는 페이지 범위가 올바르지 않습니다."
POST_UUID_MESSAGE = "게시글 ID가 UUID 형식이 아닙니다."
COMMENT_UUID_MESSAGE = "댓글 ID가 UUID 형식이 아닙니다."


class CommunityValidationError(ValueError):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def display_nickname(raw: Any) -> str:
    """profiles.nickname이 null/빈값이면 표시용 '사용자'."""
    if raw is None:
        return DEFAULT_NICKNAME
    text = str(raw).strip()
    return text if text else DEFAULT_NICKNAME


def parse_uuid(value: str, *, message: str) -> str:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, TypeError, AttributeError) as exc:
        raise CommunityValidationError(message) from exc


def parse_page_params(
    args,
    *,
    page_message: str,
    allow_q: bool = False,
    allow_category: bool = False,
) -> tuple[int, int, str | None, str | None]:
    page = _parse_positive_int(args, "page", default=1, minimum=1, maximum=None, message=page_message)
    page_size = _parse_positive_int(
        args, "page_size", default=20, minimum=1, maximum=100, message=page_message
    )

    q: str | None = None
    if allow_q:
        if "q" in args:
            raw = args.get("q")
            if raw is None:
                raise CommunityValidationError(page_message)
            if not isinstance(raw, str):
                raise CommunityValidationError(page_message)
            q = raw.strip()
            if len(q) > 100:
                raise CommunityValidationError(page_message)
            if q == "":
                q = None

    category_code: str | None = None
    if allow_category and "category_code" in args:
        raw = args.get("category_code")
        if raw is None or not isinstance(raw, str):
            raise CommunityValidationError(page_message)
        category_code = raw.strip()
        if category_code == "":
            category_code = None

    return page, page_size, q, category_code


def _parse_positive_int(
    args,
    name: str,
    *,
    default: int,
    minimum: int,
    maximum: int | None,
    message: str,
) -> int:
    if name not in args:
        return default
    raw = args.get(name)
    if raw is None or raw == "":
        raise CommunityValidationError(message)
    if not isinstance(raw, str) or not raw.isdigit():
        raise CommunityValidationError(message)
    value = int(raw)
    if value < minimum:
        raise CommunityValidationError(message)
    if maximum is not None and value > maximum:
        raise CommunityValidationError(message)
    if raw != str(value):
        raise CommunityValidationError(message)
    return value


class PostCreateInput(BaseModel):
    title: str
    content: str
    category_code: str
    image_ids: list[str] = Field(default_factory=list)

    model_config = {"extra": "forbid"}

    @field_validator("title", "content", "category_code", mode="before")
    @classmethod
    def _must_be_str(cls, value: Any) -> Any:
        if not isinstance(value, str):
            raise ValueError("string required")
        return value

    @model_validator(mode="after")
    def _normalize(self) -> PostCreateInput:
        title = self.title.strip()
        content = self.content.strip()
        category_code = self.category_code.strip()
        if not (1 <= len(title) <= 100):
            raise ValueError("title length")
        if not (1 <= len(content) <= 10000):
            raise ValueError("content length")
        if not category_code:
            raise ValueError("category")

        ids = list(self.image_ids)
        if len(ids) > MAX_IMAGES_PER_POST:
            raise ValueError("too many images")
        normalized: list[str] = []
        seen: set[str] = set()
        for raw_id in ids:
            if not isinstance(raw_id, str):
                raise ValueError("image id type")
            try:
                uid = str(uuid.UUID(raw_id))
            except ValueError as exc:
                raise ValueError("image id uuid") from exc
            if uid in seen:
                raise ValueError("duplicate image id")
            seen.add(uid)
            normalized.append(uid)

        return PostCreateInput.model_construct(
            title=title,
            content=content,
            category_code=category_code,
            image_ids=normalized,
        )


class CommentCreateInput(BaseModel):
    content: str

    model_config = {"extra": "forbid"}

    @field_validator("content", mode="before")
    @classmethod
    def _must_be_str(cls, value: Any) -> Any:
        if not isinstance(value, str):
            raise ValueError("string required")
        return value

    @model_validator(mode="after")
    def _normalize(self) -> CommentCreateInput:
        content = self.content.strip()
        if not (1 <= len(content) <= 1000):
            raise ValueError("content length")
        return CommentCreateInput.model_construct(content=content)


def parse_json_object(raw_body: bytes | str) -> dict[str, Any]:
    if isinstance(raw_body, bytes):
        text = raw_body.decode("utf-8")
    else:
        text = raw_body
    if not text or not text.strip():
        raise CommunityValidationError(POST_INPUT_MESSAGE)
    try:
        data = json.loads(text)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise CommunityValidationError(POST_INPUT_MESSAGE) from exc
    if not isinstance(data, dict):
        raise CommunityValidationError(POST_INPUT_MESSAGE)
    return data


def parse_post_create(raw_body: bytes | str) -> PostCreateInput:
    data = parse_json_object(raw_body)
    if "image_ids" in data and data["image_ids"] is None:
        raise CommunityValidationError(POST_INPUT_MESSAGE)
    if "image_ids" in data and not isinstance(data["image_ids"], list):
        raise CommunityValidationError(POST_INPUT_MESSAGE)
    try:
        return PostCreateInput.model_validate(data)
    except Exception as exc:
        raise CommunityValidationError(POST_INPUT_MESSAGE) from exc


def parse_comment_create(raw_body: bytes | str) -> CommentCreateInput:
    try:
        data = parse_json_object(raw_body)
    except CommunityValidationError as exc:
        raise CommunityValidationError(COMMENT_INPUT_MESSAGE) from exc
    try:
        return CommentCreateInput.model_validate(data)
    except Exception as exc:
        raise CommunityValidationError(COMMENT_INPUT_MESSAGE) from exc
