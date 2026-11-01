"""컬처라이프(culture_events/places/articles) 조회용 상수·검증·응답 매핑."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Mapping

INTERNAL_ERROR_MESSAGE = "서버 내부 오류가 발생했습니다."
INVALID_SECTION_MESSAGE = "section 값이 올바르지 않습니다."
INVALID_CATEGORY_MESSAGE = "category 값이 올바르지 않습니다."
INVALID_KIND_MESSAGE = "kind 값이 올바르지 않습니다."
INVALID_ARTICLE_TYPE_MESSAGE = "article_type 값이 올바르지 않습니다."
INVALID_PAGE_MESSAGE = "page 또는 page_size 값이 올바르지 않습니다."

SECTIONS: tuple[str, ...] = ("open", "stay")

# seed/실데이터 기준. section별 허용 category.
SECTION_CATEGORIES: dict[str, frozenset[str]] = {
    "open": frozenset({"ART", "MUSIC", "POP_UP", "WELLNESS"}),
    "stay": frozenset({"booktalk", "stamp_tour"}),
}

PLACE_KINDS: frozenset[str] = frozenset({"bookstore", "bathhouse", "cinema"})
ARTICLE_TYPES: frozenset[str] = frozenset({"news", "story"})

EVENT_LIST_SELECT = (
    "id, section, program_section, category, title, summary, "
    "start_date, end_date, schedule_note, place_id, place_name, district, "
    "status, badge_override, sort_weight, keep_after_end, "
    "image_path, image_credit, link_url, created_at, updated_at"
)

PLACE_LIST_SELECT = (
    "id, kind, name, district, one_liner, experience, since_year, icon_key, "
    "lat, lng, map_x, map_y, naver_map_url, instagram_url, "
    "display_order, is_published, created_at, updated_at"
)

ARTICLE_LIST_SELECT = (
    "id, article_type, title, body, label, meta, badge, badge_color, "
    "image_path, image_credit, image_badge, links, expires_at, "
    "display_order, is_published, created_at, updated_at"
)

_KST = timezone(timedelta(hours=9))


class CultureValidationError(ValueError):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def today_kst(now: datetime | None = None) -> date:
    """한국 시간 기준 오늘 날짜. tzdata 없이 고정 UTC+9 사용."""
    current = now if now is not None else datetime.now(_KST)
    if current.tzinfo is None:
        current = current.replace(tzinfo=_KST)
    else:
        current = current.astimezone(_KST)
    return current.date()


def normalize_optional_query(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip()
    return text or None


def parse_positive_int(
    args: Mapping[str, Any],
    name: str,
    *,
    default: int,
    maximum: int,
) -> int:
    if name not in args:
        return default
    raw = args.get(name)
    if raw is None or raw == "":
        raise CultureValidationError(INVALID_PAGE_MESSAGE)
    if not isinstance(raw, str) or not raw.isdigit():
        raise CultureValidationError(INVALID_PAGE_MESSAGE)
    value = int(raw)
    if value < 1 or value > maximum:
        raise CultureValidationError(INVALID_PAGE_MESSAGE)
    if raw != str(value):
        raise CultureValidationError(INVALID_PAGE_MESSAGE)
    return value


def parse_section(raw: str | None) -> str:
    value = normalize_optional_query(raw)
    if value is None:
        return "open"
    if value not in SECTIONS:
        raise CultureValidationError(INVALID_SECTION_MESSAGE)
    return value


def parse_event_category(section: str, raw: str | None) -> str | None:
    value = normalize_optional_query(raw)
    if value is None:
        return None
    allowed = SECTION_CATEGORIES[section]
    if value not in allowed:
        raise CultureValidationError(INVALID_CATEGORY_MESSAGE)
    return value


def parse_district(raw: str | None) -> str | None:
    return normalize_optional_query(raw)


def parse_place_kind(raw: str | None) -> str | None:
    value = normalize_optional_query(raw)
    if value is None:
        return None
    if value not in PLACE_KINDS:
        raise CultureValidationError(INVALID_KIND_MESSAGE)
    return value


def parse_article_type(raw: str | None) -> str | None:
    value = normalize_optional_query(raw)
    if value is None:
        return None
    if value not in ARTICLE_TYPES:
        raise CultureValidationError(INVALID_ARTICLE_TYPE_MESSAGE)
    return value


def parse_event_list_params(args: Mapping[str, Any]) -> dict[str, Any]:
    section = parse_section(args.get("section") if "section" in args else None)
    return {
        "section": section,
        "category": parse_event_category(
            section, args.get("category") if "category" in args else None
        ),
        "district": parse_district(
            args.get("district") if "district" in args else None
        ),
        "page": parse_positive_int(args, "page", default=1, maximum=10_000_000),
        "page_size": parse_positive_int(args, "page_size", default=8, maximum=50),
    }


def parse_place_list_params(args: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "kind": parse_place_kind(args.get("kind") if "kind" in args else None),
        "district": parse_district(
            args.get("district") if "district" in args else None
        ),
        "page": parse_positive_int(args, "page", default=1, maximum=10_000_000),
        "page_size": parse_positive_int(args, "page_size", default=20, maximum=50),
    }


def parse_article_list_params(args: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "article_type": parse_article_type(
            args.get("article_type") if "article_type" in args else None
        ),
        "page": parse_positive_int(args, "page", default=1, maximum=10_000_000),
        "page_size": parse_positive_int(args, "page_size", default=10, maximum=50),
    }


def _as_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and value.strip():
        return date.fromisoformat(value.strip()[:10])
    return None


def effective_end_date(start: date | None, end: date | None) -> date | None:
    if end is not None:
        return end
    return start


def schedule_status_for(
    *,
    start_date: Any,
    end_date: Any,
    today: date,
) -> str:
    """
    upcoming / ongoing / ended / unknown.
    종료 기준일 = end_date 없으면 start_date.
    종료 기준일이 오늘보다 이전만 ended(당일 포함).
    """
    start = _as_date(start_date)
    end = _as_date(end_date)
    if start is None and end is None:
        return "unknown"

    effective_end = effective_end_date(start, end)
    if effective_end is not None and effective_end < today:
        return "ended"
    if start is not None and start > today:
        return "upcoming"
    return "ongoing"


def public_visibility_or_filter(today: date) -> str:
    """
    종료된 행사는 keep_after_end=true만 포함.
    날짜가 모두 없으면 포함.
    COALESCE(end_date, start_date) >= today 를 PostgREST 조건으로 분해.
    """
    day = today.isoformat()
    return (
        f"keep_after_end.eq.true,"
        f"and(end_date.is.null,start_date.is.null),"
        f"end_date.gte.{day},"
        f"and(end_date.is.null,start_date.gte.{day})"
    )


def serialize_event_item(row: dict[str, Any], *, today: date) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "section": row["section"],
        "program_section": row.get("program_section"),
        "category": row["category"],
        "title": row["title"],
        "summary": row.get("summary"),
        "start_date": row.get("start_date"),
        "end_date": row.get("end_date"),
        "schedule_note": row.get("schedule_note"),
        "place_id": str(row["place_id"]) if row.get("place_id") is not None else None,
        "place_name": row.get("place_name"),
        "district": row.get("district"),
        "status": row.get("status"),
        "badge_override": row.get("badge_override"),
        "sort_weight": row.get("sort_weight"),
        "keep_after_end": row.get("keep_after_end"),
        "image_path": row.get("image_path"),
        "image_credit": row.get("image_credit"),
        "link_url": row.get("link_url"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "schedule_status": schedule_status_for(
            start_date=row.get("start_date"),
            end_date=row.get("end_date"),
            today=today,
        ),
    }


def serialize_place_item(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "kind": row["kind"],
        "name": row["name"],
        "district": row.get("district"),
        "one_liner": row.get("one_liner"),
        "experience": row.get("experience"),
        "since_year": row.get("since_year"),
        "icon_key": row.get("icon_key"),
        "lat": row.get("lat"),
        "lng": row.get("lng"),
        "map_x": row.get("map_x"),
        "map_y": row.get("map_y"),
        "naver_map_url": row.get("naver_map_url"),
        "instagram_url": row.get("instagram_url"),
        "display_order": row.get("display_order"),
        "is_published": row.get("is_published"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def serialize_article_item(row: dict[str, Any]) -> dict[str, Any]:
    links = row.get("links")
    if links is None:
        links = []
    return {
        "id": str(row["id"]),
        "article_type": row["article_type"],
        "title": row["title"],
        "body": row["body"],
        "label": row.get("label"),
        "meta": row.get("meta"),
        "badge": row.get("badge"),
        "badge_color": row.get("badge_color"),
        "image_path": row.get("image_path"),
        "image_credit": row.get("image_credit"),
        "image_badge": row.get("image_badge"),
        "links": links,
        "expires_at": row.get("expires_at"),
        "display_order": row.get("display_order"),
        "is_published": row.get("is_published"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }
