"""커뮤니티 사진 업로드 (FE → Flask → Supabase Storage)."""

from __future__ import annotations

import os
import uuid
from typing import Any

from config import SUPABASE_URL, supabase
from utils.image_file import MAX_IMAGE_BYTES, detect_image

BUCKET = "community-images"


class UploadConfigError(Exception):
    """서버용 Storage 키가 없음."""


class UploadValidationError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


class UploadQueryError(Exception):
    """Storage/DB 실패."""


def _require_secret_key() -> None:
    """익명 쓰기로 우회하지 않음. SUPABASE_SECRET_KEY 필수."""
    if not os.getenv("SUPABASE_SECRET_KEY"):
        raise UploadConfigError(
            "SUPABASE_SECRET_KEY가 없어 Storage 업로드를 수행할 수 없습니다."
        )


def _public_url(storage_path: str) -> str:
    base = (SUPABASE_URL or "").rstrip("/")
    return f"{base}/storage/v1/object/public/{BUCKET}/{storage_path}"


def upload_image(*, owner_id: str, file_bytes: bytes, filename_hint: str | None) -> dict[str, Any]:
    _require_secret_key()

    if not file_bytes:
        raise UploadValidationError(
            400,
            "multipart/form-data의 file이 누락되었거나 파일이 비어 있거나 손상되었습니다.",
        )
    if len(file_bytes) > MAX_IMAGE_BYTES:
        raise UploadValidationError(
            413,
            "사진 파일이 최대 크기 5MiB를 초과했습니다.",
        )

    detected = detect_image(file_bytes)
    if detected is None:
        raise UploadValidationError(
            415,
            "지원하지 않는 사진 형식입니다. JPEG, PNG, WebP만 허용합니다.",
        )

    image_id = str(uuid.uuid4())
    storage_path = f"{owner_id}/{image_id}.{detected.extension}"
    public_url = _public_url(storage_path)

    try:
        supabase.storage.from_(BUCKET).upload(
            storage_path,
            file_bytes,
            file_options={
                "content-type": detected.mime,
                "upsert": "false",
            },
        )
    except Exception as exc:
        raise UploadQueryError("Storage 업로드 실패") from exc

    try:
        response = (
            supabase.table("post_images")
            .insert({
                "id": image_id,
                "owner_id": owner_id,
                "post_id": None,
                "storage_path": storage_path,
                "public_url": public_url,
                "sort_order": 0,
            })
            .execute()
        )
    except Exception as exc:
        # DB 실패 시 Storage 파일 정리
        try:
            supabase.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass
        raise UploadQueryError("post_images 기록 실패") from exc

    rows = response.data or []
    if not rows:
        try:
            supabase.storage.from_(BUCKET).remove([storage_path])
        except Exception:
            pass
        raise UploadQueryError("post_images 기록 결과 없음")

    return {
        "id": str(rows[0]["id"]),
        "url": rows[0].get("public_url") or public_url,
    }
