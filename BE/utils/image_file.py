"""업로드 이미지 바이트 검증 (확장자/클라이언트 MIME 비신뢰)."""

from __future__ import annotations

from dataclasses import dataclass

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MiB — Storage 버킷 설정과 동일


@dataclass(frozen=True)
class DetectedImage:
    mime: str
    extension: str


def detect_image(data: bytes) -> DetectedImage | None:
    """매직 바이트로 JPEG/PNG/WebP만 허용. 실패 시 None."""
    if not data:
        return None
    if len(data) >= 3 and data[0:3] == b"\xff\xd8\xff":
        return DetectedImage(mime="image/jpeg", extension="jpg")
    if len(data) >= 8 and data[0:8] == b"\x89PNG\r\n\x1a\n":
        return DetectedImage(mime="image/png", extension="png")
    if (
        len(data) >= 12
        and data[0:4] == b"RIFF"
        and data[8:12] == b"WEBP"
    ):
        return DetectedImage(mime="image/webp", extension="webp")
    return None
