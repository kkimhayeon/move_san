from __future__ import annotations

from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

from postgrest.exceptions import APIError

from schemas.culture_schema import (
    schedule_status_for,
    today_kst,
)


def _event_row(**overrides):
    row = {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "section": "open",
        "program_section": None,
        "category": "ART",
        "title": "테스트 전시",
        "summary": "요약",
        "start_date": "2026-10-20",
        "end_date": "2026-11-30",
        "schedule_note": None,
        "place_id": None,
        "place_name": "공간",
        "district": "해운대구",
        "status": "approved",
        "badge_override": None,
        "sort_weight": 10,
        "keep_after_end": False,
        "image_path": None,
        "image_credit": None,
        "link_url": "https://example.com",
        "created_at": "2026-10-01T00:00:00+00:00",
        "updated_at": "2026-10-01T00:00:00+00:00",
    }
    row.update(overrides)
    return row


def _place_row(**overrides):
    row = {
        "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        "kind": "bookstore",
        "name": "테스트 서점",
        "district": "수영구",
        "one_liner": "한줄",
        "experience": None,
        "since_year": 2010,
        "icon_key": None,
        "lat": 35.1,
        "lng": 129.1,
        "map_x": 60.0,
        "map_y": 54.0,
        "naver_map_url": None,
        "instagram_url": None,
        "display_order": 1,
        "is_published": True,
        "created_at": "2026-10-01T00:00:00+00:00",
        "updated_at": "2026-10-01T00:00:00+00:00",
    }
    row.update(overrides)
    return row


def _article_row(**overrides):
    row = {
        "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        "article_type": "news",
        "title": "뉴스",
        "body": "본문",
        "label": None,
        "meta": None,
        "badge": None,
        "badge_color": None,
        "image_path": None,
        "image_credit": None,
        "image_badge": None,
        "links": [{"label": "원문 보기", "url": "https://example.com"}],
        "expires_at": None,
        "display_order": 1,
        "is_published": True,
        "created_at": "2026-10-01T00:00:00+00:00",
        "updated_at": "2026-10-01T00:00:00+00:00",
    }
    row.update(overrides)
    return row


def _mock_list_chain(sb, data, *, count=None):
    chain = MagicMock()
    sb.table.return_value.select.return_value = chain
    chain.eq.return_value = chain
    chain.or_.return_value = chain
    chain.order.return_value = chain
    chain.range.return_value = chain
    chain.limit.return_value = chain
    result = MagicMock(data=data, count=count if count is not None else len(data))
    chain.execute.return_value = result
    return chain


# --- schedule_status / KST ---


def test_schedule_status_matrix():
    today = date(2026, 10, 29)
    assert schedule_status_for(start_date=None, end_date=None, today=today) == "unknown"
    assert schedule_status_for(
        start_date="2026-11-01", end_date="2026-11-10", today=today
    ) == "upcoming"
    assert schedule_status_for(
        start_date="2026-10-01", end_date="2026-11-10", today=today
    ) == "ongoing"
    assert schedule_status_for(
        start_date="2026-10-29", end_date="2026-10-29", today=today
    ) == "ongoing"
    assert schedule_status_for(
        start_date="2026-10-20", end_date="2026-10-28", today=today
    ) == "ended"
    # end 없으면 start가 종료 기준
    assert schedule_status_for(
        start_date="2026-10-28", end_date=None, today=today
    ) == "ended"
    assert schedule_status_for(
        start_date="2026-10-29", end_date=None, today=today
    ) == "ongoing"
    # start 없고 end만
    assert schedule_status_for(
        start_date=None, end_date="2026-11-01", today=today
    ) == "ongoing"
    assert schedule_status_for(
        start_date=None, end_date="2026-10-28", today=today
    ) == "ended"


def test_today_kst_boundary():
    # UTC 2026-10-28 15:00 = KST 2026-10-29 00:00
    assert today_kst(datetime(2026, 10, 28, 15, 0, tzinfo=timezone.utc)) == date(
        2026, 10, 29
    )
    # UTC 2026-10-28 14:59 = KST 2026-10-28 23:59
    assert today_kst(datetime(2026, 10, 28, 14, 59, tzinfo=timezone.utc)) == date(
        2026, 10, 28
    )


# --- events ---


def test_events_forces_approved_and_visibility_filter(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [_event_row()], count=1)
        res = client.get("/api/v1/culture/events")
    assert res.status_code == 200
    chain.eq.assert_any_call("status", "approved")
    chain.eq.assert_any_call("section", "open")
    or_arg = chain.or_.call_args.args[0]
    assert "keep_after_end.eq.true" in or_arg
    assert "end_date.gte.2026-10-29" in or_arg
    assert "and(end_date.is.null,start_date.is.null)" in or_arg
    assert "and(end_date.is.null,start_date.gte.2026-10-29)" in or_arg
    body = res.get_json()
    assert body["result"]["page"] == 1
    assert body["result"]["page_size"] == 8
    assert body["result"]["total"] == 1
    item = body["result"]["items"][0]
    assert item["schedule_status"] == "ongoing"
    assert "content_key" not in item
    assert "raw" not in item
    assert "source" not in item


def test_events_end_date_today_included_yesterday_excluded_via_filter(client):
    """종료 당일은 필터에 포함, 전날은 keep_after_end 없으면 제외(필터 문자열)."""
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [], count=0)
        client.get("/api/v1/culture/events")
    or_arg = chain.or_.call_args.args[0]
    # 당일: end_date.gte.today 로 포함
    assert "end_date.gte.2026-10-29" in or_arg
    # 전날 종료 + keep_after_end=false 는 네 조건 어디에도 안 걸림


def test_events_keep_after_end_ended_status(client):
    row = _event_row(
        start_date="2026-10-24",
        end_date="2026-10-24",
        keep_after_end=True,
    )
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        _mock_list_chain(sb, [row], count=1)
        res = client.get("/api/v1/culture/events")
    item = res.get_json()["result"]["items"][0]
    assert item["schedule_status"] == "ended"
    assert item["keep_after_end"] is True


def test_events_no_end_date_and_unknown_dates(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        _mock_list_chain(
            sb,
            [
                _event_row(start_date="2026-10-29", end_date=None),
                _event_row(
                    id="dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                    start_date=None,
                    end_date=None,
                ),
            ],
            count=2,
        )
        res = client.get("/api/v1/culture/events")
    items = res.get_json()["result"]["items"]
    assert items[0]["schedule_status"] == "ongoing"
    assert items[1]["schedule_status"] == "unknown"


def test_events_rejects_client_status_query_by_ignoring_and_forcing_approved(client):
    """클라이언트가 status를 넘겨도 서버는 approved만 조회."""
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/events?status=candidate")
    assert res.status_code == 200
    status_calls = [c for c in chain.eq.call_args_list if c.args[0] == "status"]
    assert len(status_calls) == 1
    assert status_calls[0].args == ("status", "approved")


def test_events_category_and_district_filters(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [], count=0)
        res = client.get(
            "/api/v1/culture/events?section=open&category=MUSIC&district=%ED%95%B4%EC%9A%B4%EB%8C%80%EA%B5%AC"
        )
    assert res.status_code == 200
    chain.eq.assert_any_call("category", "MUSIC")
    chain.eq.assert_any_call("district", "해운대구")


def test_events_stay_category_validation(client):
    res = client.get("/api/v1/culture/events?section=stay&category=ART")
    assert res.status_code == 400
    assert "category" in res.get_json()["message"]

    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/events?section=stay&category=booktalk")
    assert res.status_code == 200
    chain.eq.assert_any_call("section", "stay")
    chain.eq.assert_any_call("category", "booktalk")


def test_events_invalid_query_400(client):
    assert client.get("/api/v1/culture/events?section=meet").status_code == 400
    assert client.get("/api/v1/culture/events?category=UNKNOWN").status_code == 400
    assert client.get("/api/v1/culture/events?page=0").status_code == 400
    assert client.get("/api/v1/culture/events?page=-1").status_code == 400
    assert client.get("/api/v1/culture/events?page=1.5").status_code == 400
    assert client.get("/api/v1/culture/events?page_size=0").status_code == 400
    assert client.get("/api/v1/culture/events?page_size=51").status_code == 400
    assert client.get("/api/v1/culture/events?page_size=abc").status_code == 400


def test_events_empty_and_out_of_range_page(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/events?page=99")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 99


def test_events_pgrst103_returns_empty_with_total(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = MagicMock()
        sb.table.return_value.select.return_value = chain
        chain.eq.return_value = chain
        chain.or_.return_value = chain
        chain.order.return_value = chain
        chain.range.return_value = chain
        chain.execute.side_effect = APIError({
            "message": "Requested range not satisfiable",
            "code": "PGRST103",
            "hint": None,
            "details": "An offset of 80 was requested, but there are only 34 rows",
        })
        res = client.get("/api/v1/culture/events?page=11&page_size=8")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 34


def test_events_ordering(client):
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.today_kst", return_value=date(2026, 10, 29)
    ):
        chain = _mock_list_chain(sb, [], count=0)
        client.get("/api/v1/culture/events")
    assert chain.order.call_args_list[0].args == ("sort_weight",)
    assert chain.order.call_args_list[0].kwargs.get("desc") is True
    assert chain.order.call_args_list[1].args == ("start_date",)
    assert chain.order.call_args_list[1].kwargs.get("nullsfirst") is False
    assert chain.order.call_args_list[2].args == ("id",)


def test_events_db_error_hides_detail(client):
    with patch("services.culture_service.supabase") as sb:
        sb.table.side_effect = RuntimeError("secret connection string")
        res = client.get("/api/v1/culture/events")
    assert res.status_code == 500
    body = res.get_json()
    assert body["result"] is None
    assert "secret" not in (body["message"] or "")


# --- places ---


def test_places_forces_published(client):
    with patch("services.culture_service.supabase") as sb:
        chain = _mock_list_chain(sb, [_place_row(lat=None, lng=None)], count=1)
        res = client.get("/api/v1/culture/places")
    assert res.status_code == 200
    chain.eq.assert_any_call("is_published", True)
    body = res.get_json()["result"]
    assert body["page_size"] == 20
    item = body["items"][0]
    assert item["lat"] is None
    assert item["map_x"] == 60.0
    assert "content_key" not in item


def test_places_kind_and_district(client):
    with patch("services.culture_service.supabase") as sb:
        chain = _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/places?kind=bathhouse&district=%EC%88%98%EC%98%81%EA%B5%AC")
    assert res.status_code == 200
    chain.eq.assert_any_call("kind", "bathhouse")
    chain.eq.assert_any_call("district", "수영구")


def test_places_invalid_kind_400(client):
    res = client.get("/api/v1/culture/places?kind=cafe")
    assert res.status_code == 400
    assert "kind" in res.get_json()["message"]


def test_places_ordering(client):
    with patch("services.culture_service.supabase") as sb:
        chain = _mock_list_chain(sb, [], count=0)
        client.get("/api/v1/culture/places")
    assert chain.order.call_args_list[0].args == ("display_order",)
    assert chain.order.call_args_list[1].args == ("id",)


# --- articles ---


def test_articles_forces_published_and_expires_filter(client):
    fixed_now = datetime(2026, 10, 29, 12, 0, tzinfo=timezone.utc)
    with patch("services.culture_service.supabase") as sb, patch(
        "services.culture_service.datetime"
    ) as dt:
        dt.now.return_value = fixed_now
        chain = _mock_list_chain(sb, [_article_row()], count=1)
        res = client.get("/api/v1/culture/articles")
    assert res.status_code == 200
    chain.eq.assert_any_call("is_published", True)
    or_arg = chain.or_.call_args.args[0]
    assert "expires_at.is.null" in or_arg
    assert "expires_at.gt." in or_arg
    assert "2026-10-29" in or_arg
    body = res.get_json()["result"]
    assert body["page_size"] == 10
    item = body["items"][0]
    assert item["links"] == [{"label": "원문 보기", "url": "https://example.com"}]
    assert "content_key" not in item


def test_articles_type_filter_and_validation(client):
    assert client.get("/api/v1/culture/articles?article_type=blog").status_code == 400
    with patch("services.culture_service.supabase") as sb:
        chain = _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/articles?article_type=story")
    assert res.status_code == 200
    chain.eq.assert_any_call("article_type", "story")


def test_articles_empty_200(client):
    with patch("services.culture_service.supabase") as sb:
        _mock_list_chain(sb, [], count=0)
        res = client.get("/api/v1/culture/articles?page=5")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 5
