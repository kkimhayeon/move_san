from __future__ import annotations

from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

USER_A = "11111111-1111-4111-8111-111111111111"
USER_B = "22222222-2222-4222-8222-222222222222"
POST_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
COMMENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
IMAGE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
IMAGE_ID_2 = "dddddddd-dddd-4ddd-8ddd-dddddddddddd"
THUMB_URL = "https://example.supabase.co/storage/v1/object/public/community-images/u/a.jpg"

AUTH_A = {"Authorization": "Bearer token-a"}
AUTH_B = {"Authorization": "Bearer token-b"}
AUTH_BAD = {"Authorization": "Bearer bad-token"}

# Minimal valid JPEG (SOI + APP0 stub + EOI-ish magic prefix)
JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 32
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def _auth_side_effect(token: str):
    from services.auth_service import AuthError

    if token == "token-a":
        return {"user_id": USER_A, "email": "a@test.com"}
    if token == "token-b":
        return {"user_id": USER_B, "email": "b@test.com"}
    raise AuthError("invalid")


@pytest.fixture
def auth_ok(monkeypatch):
    monkeypatch.setattr("utils.auth.verify_token", _auth_side_effect)


def _post_row(**overrides):
    row = {
        "id": POST_ID,
        "title": "제목",
        "content": "본문입니다",
        "category_code": "LOCAL_LIFE",
        "created_at": "2026-10-26T07:00:00Z",
        "updated_at": "2026-10-26T07:00:00Z",
        "author_id": USER_A,
        "author": {"nickname": "작성자A"},
        "deleted_at": None,
    }
    row.update(overrides)
    return row


def _comment_row(**overrides):
    row = {
        "id": COMMENT_ID,
        "content": "댓글입니다",
        "created_at": "2026-10-26T07:00:00Z",
        "author_id": USER_A,
        "post_id": POST_ID,
        "author": {"nickname": None},
        "deleted_at": None,
    }
    row.update(overrides)
    return row


def _mock_list_chain(
    sb,
    *,
    data,
    count,
    expect_or=False,
    expect_category=False,
    thumb_rows=None,
    category_exists=True,
):
    posts = MagicMock()
    images = MagicMock()
    categories = MagicMock()

    def router(name):
        if name == "post_images":
            return images
        if name == "post_categories":
            return categories
        return posts

    sb.table.side_effect = router

    filtered = MagicMock()
    posts.select.return_value.is_.return_value = filtered
    current = filtered
    if expect_category:
        after_eq = MagicMock()
        filtered.eq.return_value = after_eq
        current = after_eq
    if expect_or:
        after_or = MagicMock()
        current.or_.return_value = after_or
        ordered_base = after_or
    else:
        ordered_base = current

    ranged = MagicMock()
    ordered_base.order.return_value.order.return_value = ranged
    ranged.range.return_value.execute.return_value = MagicMock(data=data, count=count)

    images.select.return_value.in_.return_value.is_.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
        data=thumb_rows if thumb_rows is not None else []
    )

    cat_data = [{"code": "LOCAL_LIFE"}] if category_exists else []
    categories.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=cat_data
    )

    return filtered, ranged, ordered_base, current


def _mock_empty_images(table_mock):
    table_mock.select.return_value.eq.return_value.is_.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
        data=[]
    )


def test_categories(client):
    with patch("services.post_service.supabase") as sb:
        sb.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {"code": "LOCAL_LIFE", "name": "동네생활"},
                {"code": "BUSAN_TIPS", "name": "부산꿀팁"},
            ]
        )
        res = client.get("/api/v1/posts/categories")
    assert res.status_code == 200
    assert res.get_json()["result"]["items"][0] == {
        "code": "LOCAL_LIFE",
        "name": "동네생활",
    }


def test_list_posts_anonymous_is_author_false(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[_post_row()], count=1)
        res = client.get("/api/v1/posts")
    assert res.status_code == 200
    item = res.get_json()["result"]["items"][0]
    assert item["is_author"] is False
    assert item["thumbnail_url"] is None
    assert "images" not in item


def test_list_posts_owner_is_author_true(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[_post_row()], count=1)
        res = client.get("/api/v1/posts", headers=AUTH_A)
    assert res.status_code == 200
    assert res.get_json()["result"]["items"][0]["is_author"] is True


def test_list_posts_bad_token_401(client, auth_ok):
    res = client.get("/api/v1/posts", headers=AUTH_BAD)
    assert res.status_code == 401
    assert res.get_json()["result"] is None


def test_list_posts_category_filter(client):
    with patch("services.post_service.supabase") as sb:
        filtered, _, _, current = _mock_list_chain(
            sb, data=[_post_row()], count=1, expect_category=True
        )
        res = client.get("/api/v1/posts?category_code=LOCAL_LIFE")
    assert res.status_code == 200
    filtered.eq.assert_called_with("category_code", "LOCAL_LIFE")
    assert res.get_json()["result"]["items"][0]["category_code"] == "LOCAL_LIFE"


def test_list_posts_unknown_category_400(client):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[], count=0, expect_category=True, category_exists=False)
        res = client.get("/api/v1/posts?category_code=NOPE")
    assert res.status_code == 400


def test_list_posts_thumbnail_batch(client):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(
            sb,
            data=[_post_row()],
            count=1,
            thumb_rows=[
                {
                    "post_id": POST_ID,
                    "public_url": THUMB_URL,
                    "sort_order": 0,
                }
            ],
        )
        res = client.get("/api/v1/posts")
    assert res.status_code == 200
    assert res.get_json()["result"]["items"][0]["thumbnail_url"] == THUMB_URL


def test_create_post_unauthorized(client):
    res = client.post(
        "/api/v1/posts",
        json={"title": "a", "content": "b", "category_code": "LOCAL_LIFE"},
    )
    assert res.status_code == 401


def _mock_create_flow(sb, *, images=None, rpc_error=None):
    posts = MagicMock()
    images_t = MagicMock()
    profiles = MagicMock()
    categories = MagicMock()

    def router(name):
        if name == "post_images":
            return images_t
        if name == "profiles":
            return profiles
        if name == "post_categories":
            return categories
        return posts

    sb.table.side_effect = router

    profiles.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": USER_A}]
    )
    categories.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"code": "LOCAL_LIFE"}]
    )
    posts.insert.return_value.execute.return_value = MagicMock(data=[{"id": POST_ID}])
    posts.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[_post_row()]
    )
    images_t.select.return_value.eq.return_value.is_.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
        data=images or []
    )

    if rpc_error is not None:
        sb.rpc.return_value.execute.side_effect = rpc_error
        posts.update.return_value.eq.return_value.eq.return_value.is_.return_value.execute.return_value = MagicMock(
            data=[{"id": POST_ID}]
        )
    else:
        sb.rpc.return_value.execute.return_value = MagicMock(data=None)

    return posts, images_t


def test_create_post_success(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_create_flow(sb)
        res = client.post(
            "/api/v1/posts",
            headers=AUTH_A,
            json={
                "title": " 제목 ",
                "content": " 본문 ",
                "category_code": "LOCAL_LIFE",
            },
        )
    assert res.status_code == 201
    body = res.get_json()
    assert body["status"] == 201
    assert body["result"]["images"] == []
    assert body["result"]["is_author"] is True
    sb.rpc.assert_not_called()


def test_create_post_image_ids_empty_ok(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_create_flow(sb)
        res = client.post(
            "/api/v1/posts",
            headers=AUTH_A,
            json={
                "title": "제목",
                "content": "본문",
                "category_code": "LOCAL_LIFE",
                "image_ids": [],
            },
        )
    assert res.status_code == 201
    sb.rpc.assert_not_called()


def test_create_post_with_images_success(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_create_flow(
            sb,
            images=[{"id": IMAGE_ID, "public_url": THUMB_URL, "sort_order": 0}],
        )
        res = client.post(
            "/api/v1/posts",
            headers=AUTH_A,
            json={
                "title": "제목",
                "content": "본문",
                "category_code": "LOCAL_LIFE",
                "image_ids": [IMAGE_ID],
            },
        )
    assert res.status_code == 201
    sb.rpc.assert_called_once()
    args = sb.rpc.call_args
    assert args.args[0] == "attach_post_images"
    assert args.args[1]["p_image_ids"] == [IMAGE_ID]
    assert res.get_json()["result"]["images"] == [{"id": IMAGE_ID, "url": THUMB_URL}]


def test_create_post_duplicate_image_ids_rejected(client, auth_ok):
    res = client.post(
        "/api/v1/posts",
        headers=AUTH_A,
        json={
            "title": "제목",
            "content": "본문",
            "category_code": "LOCAL_LIFE",
            "image_ids": [IMAGE_ID, IMAGE_ID],
        },
    )
    assert res.status_code == 400


def test_create_post_foreign_or_attached_image_rejected(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        _mock_create_flow(sb, rpc_error=Exception("image attach validation failed"))
        res = client.post(
            "/api/v1/posts",
            headers=AUTH_A,
            json={
                "title": "제목",
                "content": "본문",
                "category_code": "LOCAL_LIFE",
                "image_ids": [IMAGE_ID],
            },
        )
    assert res.status_code == 400


def test_get_post_detail(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        posts = MagicMock()
        images = MagicMock()

        def router(name):
            return images if name == "post_images" else posts

        sb.table.side_effect = router
        posts.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_post_row()]
        )
        images.select.return_value.eq.return_value.is_.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
            data=[]
        )
        res = client.get(f"/api/v1/posts/{POST_ID}")
    assert res.status_code == 200
    assert res.get_json()["result"]["images"] == []


def test_get_post_detail_with_images_sorted(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        posts = MagicMock()
        images = MagicMock()

        def router(name):
            return images if name == "post_images" else posts

        sb.table.side_effect = router
        posts.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_post_row()]
        )
        images.select.return_value.eq.return_value.is_.return_value.order.return_value.order.return_value.execute.return_value = MagicMock(
            data=[
                {"id": IMAGE_ID, "public_url": THUMB_URL, "sort_order": 0},
                {"id": IMAGE_ID_2, "public_url": THUMB_URL + "2", "sort_order": 1},
            ]
        )
        res = client.get(f"/api/v1/posts/{POST_ID}")
    assert res.status_code == 200
    imgs = res.get_json()["result"]["images"]
    assert [i["id"] for i in imgs] == [IMAGE_ID, IMAGE_ID_2]


def test_get_post_invalid_uuid(client):
    res = client.get("/api/v1/posts/not-a-uuid")
    assert res.status_code == 400


def test_delete_post_forbidden(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_post_row(author_id=USER_A)]
        )
        res = client.delete(f"/api/v1/posts/{POST_ID}", headers=AUTH_B)
    assert res.status_code == 403


def test_delete_post_success_cleans_storage(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        posts = MagicMock()
        images = MagicMock()

        def router(name):
            return images if name == "post_images" else posts

        sb.table.side_effect = router
        posts.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_post_row(author_id=USER_A)]
        )
        images.select.return_value.eq.return_value.is_.return_value.execute.return_value = MagicMock(
            data=[{"id": IMAGE_ID, "storage_path": f"{USER_A}/{IMAGE_ID}.jpg"}]
        )
        posts.update.return_value.eq.return_value.eq.return_value.is_.return_value.select.return_value.execute.return_value = MagicMock(
            data=[{"id": POST_ID}]
        )
        images.update.return_value.eq.return_value.is_.return_value.execute.return_value = MagicMock(
            data=[{"id": IMAGE_ID}]
        )
        res = client.delete(f"/api/v1/posts/{POST_ID}", headers=AUTH_A)
    assert res.status_code == 200
    assert res.get_json()["result"] is None
    sb.storage.from_.assert_called_with("community-images")
    sb.storage.from_.return_value.remove.assert_called_once()


def test_delete_post_already_deleted(client, auth_ok):
    with patch("services.post_service.supabase") as sb:
        sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_post_row(deleted_at="2026-10-26T08:00:00Z")]
        )
        res = client.delete(f"/api/v1/posts/{POST_ID}", headers=AUTH_A)
    assert res.status_code == 404


def test_comments_on_missing_post(client, auth_ok):
    with patch("services.comment_service.post_exists_active", return_value=False):
        res = client.get(f"/api/v1/posts/{POST_ID}/comments")
    assert res.status_code == 404


def test_create_comment_and_list(client, auth_ok):
    with patch("services.comment_service.post_exists_active", return_value=True), patch(
        "services.comment_service.supabase"
    ) as sb:
        table = sb.table.return_value
        table.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[{"id": USER_A}]
        )
        table.insert.return_value.execute.return_value = MagicMock(data=[{"id": COMMENT_ID}])
        table.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_comment_row()]
        )
        res = client.post(
            f"/api/v1/posts/{POST_ID}/comments",
            headers=AUTH_A,
            json={"content": " 댓글입니다 "},
        )
    assert res.status_code == 201
    assert res.get_json()["result"]["author"]["nickname"] == "사용자"


def test_delete_comment_forbidden(client, auth_ok):
    with patch("services.comment_service.supabase") as sb, patch(
        "services.comment_service.post_exists_active", return_value=True
    ):
        sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_comment_row(author_id=USER_A)]
        )
        res = client.delete(f"/api/v1/comments/{COMMENT_ID}", headers=AUTH_B)
    assert res.status_code == 403


def test_delete_comment_success(client, auth_ok):
    with patch("services.comment_service.supabase") as sb, patch(
        "services.comment_service.post_exists_active", return_value=True
    ):
        table = sb.table.return_value
        table.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[_comment_row(author_id=USER_A)]
        )
        table.update.return_value.eq.return_value.eq.return_value.is_.return_value.select.return_value.execute.return_value = MagicMock(
            data=[{"id": COMMENT_ID}]
        )
        res = client.delete(f"/api/v1/comments/{COMMENT_ID}", headers=AUTH_A)
    assert res.status_code == 200


def test_blank_title_rejected(client, auth_ok):
    res = client.post(
        "/api/v1/posts",
        headers=AUTH_A,
        json={"title": "   ", "content": "본문", "category_code": "LOCAL_LIFE"},
    )
    assert res.status_code == 400


def test_invalid_page(client):
    res = client.get("/api/v1/posts?page=0")
    assert res.status_code == 400


def test_list_posts_post_summary_schema(client):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[_post_row()], count=1)
        res = client.get("/api/v1/posts")
    assert res.status_code == 200
    body = res.get_json()
    result = body["result"]
    assert set(result.keys()) == {"items", "page", "page_size", "total"}
    item = result["items"][0]
    assert set(item.keys()) == {
        "id",
        "title",
        "author",
        "created_at",
        "category_code",
        "thumbnail_url",
        "is_author",
    }
    assert "content" not in item
    assert "images" not in item


def test_list_posts_applies_deleted_null_filter(client):
    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[], count=0)
        client.get("/api/v1/posts")
        posts = sb.table.side_effect("posts")
        # re-call via last posts mock from side_effect is awkward; assert via router call
        assert any(c.args[0] == "posts" for c in sb.table.call_args_list)


def test_list_posts_sort_order_created_at_id_desc(client):
    with patch("services.post_service.supabase") as sb:
        _, _, ordered_base, _ = _mock_list_chain(sb, data=[], count=0)
        client.get("/api/v1/posts")
        order_calls = ordered_base.order.call_args_list
        assert order_calls[0].args[0] == "created_at"
        assert order_calls[0].kwargs.get("desc") is True
        second = ordered_base.order.return_value.order
        assert second.call_args.args[0] == "id"
        assert second.call_args.kwargs.get("desc") is True


def test_list_posts_empty_search_result(client):
    with patch("services.post_service.supabase") as sb:
        filtered, _, _, current = _mock_list_chain(
            sb, data=[], count=0, expect_or=True
        )
        res = client.get("/api/v1/posts?q=존재하지않는검색어xyz")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 0
    current.or_.assert_called_once()


def test_list_posts_blank_q_means_full_list(client):
    with patch("services.post_service.supabase") as sb:
        filtered, _, _, current = _mock_list_chain(sb, data=[_post_row()], count=1)
        res = client.get("/api/v1/posts?q=%20%20")
    assert res.status_code == 200
    current.or_.assert_not_called()


def test_list_posts_q_is_stripped_before_filter(client):
    with patch("services.post_service.supabase") as sb:
        _, _, _, current = _mock_list_chain(sb, data=[], count=0, expect_or=True)
        client.get("/api/v1/posts?q=%20Busan%20")
        called = current.or_.call_args[0][0]
        assert "Busan" in called
        assert called.startswith("title.ilike.")


def test_list_posts_search_applies_same_filter_for_items_and_total(client):
    with patch("services.post_service.supabase") as sb:
        _, _, _, current = _mock_list_chain(
            sb, data=[_post_row()], count=3, expect_or=True
        )
        res = client.get("/api/v1/posts?q=제목")
    assert res.status_code == 200
    result = res.get_json()["result"]
    assert result["total"] == 3
    assert len(result["items"]) == 1
    current.or_.assert_called_once()


def test_list_posts_default_pagination_range(client):
    with patch("services.post_service.supabase") as sb:
        _, ranged, _, _ = _mock_list_chain(sb, data=[], count=0)
        client.get("/api/v1/posts")
        ranged.range.assert_called_once_with(0, 19)


def test_list_posts_page_size_1_ranges(client):
    with patch("services.post_service.supabase") as sb:
        _, ranged, _, _ = _mock_list_chain(
            sb,
            data=[_post_row(id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1")],
            count=5,
        )
        res1 = client.get("/api/v1/posts?page=1&page_size=1")
        ranged.range.assert_called_with(0, 0)
        assert res1.get_json()["result"]["total"] == 5

        _, ranged2, _, _ = _mock_list_chain(
            sb,
            data=[_post_row(id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2")],
            count=5,
        )
        res2 = client.get("/api/v1/posts?page=2&page_size=1")
        ranged2.range.assert_called_with(1, 1)
        assert res2.get_json()["result"]["total"] == 5


def test_list_posts_past_last_page_empty_items_keeps_total(client):
    with patch("services.post_service.supabase") as sb:
        _, ranged, _, _ = _mock_list_chain(sb, data=[], count=2)
        res = client.get("/api/v1/posts?page=99&page_size=1")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 2
    ranged.range.assert_called_with(98, 98)


def test_list_posts_pgrst103_returns_empty_with_total(client):
    from postgrest.exceptions import APIError

    with patch("services.post_service.supabase") as sb:
        _, ranged, _, _ = _mock_list_chain(sb, data=[], count=0)
        ranged.range.return_value.execute.side_effect = APIError({
            "message": "Requested range not satisfiable",
            "code": "PGRST103",
            "hint": None,
            "details": "An offset of 2 was requested, but there are only 1 rows.",
        })
        res = client.get("/api/v1/posts?page=3&page_size=1")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 1


def test_list_posts_search_with_pagination(client):
    with patch("services.post_service.supabase") as sb:
        _, ranged, _, current = _mock_list_chain(
            sb, data=[], count=7, expect_or=True
        )
        res = client.get("/api/v1/posts?q=busan&page=2&page_size=3")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["page"] == 2
    assert body["page_size"] == 3
    assert body["total"] == 7
    current.or_.assert_called_once()
    ranged.range.assert_called_with(3, 5)


def test_list_posts_category_with_search(client):
    with patch("services.post_service.supabase") as sb:
        filtered, ranged, _, current = _mock_list_chain(
            sb, data=[], count=1, expect_or=True, expect_category=True
        )
        res = client.get("/api/v1/posts?category_code=LOCAL_LIFE&q=꿀팁&page=1&page_size=10")
    assert res.status_code == 200
    filtered.eq.assert_called_with("category_code", "LOCAL_LIFE")
    current.or_.assert_called_once()
    ranged.range.assert_called_with(0, 9)


@pytest.mark.parametrize(
    "query",
    [
        "page=0",
        "page_size=0",
        "page_size=101",
        "page=abc",
        "page_size=1.5",
        "page=-1",
        "page_size=-1",
        "page=01",
        "q=" + ("x" * 101),
    ],
)
def test_list_posts_invalid_query_params(client, query):
    res = client.get(f"/api/v1/posts?{query}")
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == 400
    assert body["result"] is None


def test_search_special_chars_builds_safe_filter(auth_ok):
    from services.post_service import _escape_postgrest_ilike_value, list_posts

    pattern = _escape_postgrest_ilike_value("a,b(c)%_*")
    assert pattern == '"*a,b(c)%_\\**"'

    with patch("services.post_service.supabase") as sb:
        _mock_list_chain(sb, data=[], count=0, expect_or=True)
        list_posts(
            page=1, page_size=20, q="hello,world", category_code=None, viewer_id=None
        )
        posts = [c for c in sb.table.call_args_list if c.args[0] == "posts"]
        assert posts


def test_upload_requires_auth(client):
    res = client.post(
        "/api/v1/uploads/images",
        data={"file": (BytesIO(JPEG_BYTES), "a.jpg")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 401


def test_upload_image_success(client, auth_ok, monkeypatch):
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "test-secret-not-real")
    with patch("services.upload_service.supabase") as sb:
        sb.storage.from_.return_value.upload.return_value = MagicMock()
        sb.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": IMAGE_ID, "public_url": THUMB_URL}]
        )
        res = client.post(
            "/api/v1/uploads/images",
            headers=AUTH_A,
            data={"file": (BytesIO(JPEG_BYTES), "photo.jpg")},
            content_type="multipart/form-data",
        )
    assert res.status_code == 201
    body = res.get_json()
    assert body["result"]["id"] == IMAGE_ID
    assert body["result"]["url"] == THUMB_URL
    sb.storage.from_.assert_called_with("community-images")


def test_upload_rejects_non_image(client, auth_ok, monkeypatch):
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "test-secret-not-real")
    res = client.post(
        "/api/v1/uploads/images",
        headers=AUTH_A,
        data={"file": (BytesIO(b"not-an-image"), "a.jpg")},
        content_type="multipart/form-data",
    )
    assert res.status_code == 415


def test_upload_rejects_missing_file(client, auth_ok, monkeypatch):
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "test-secret-not-real")
    res = client.post(
        "/api/v1/uploads/images",
        headers=AUTH_A,
        data={},
        content_type="multipart/form-data",
    )
    assert res.status_code == 400


def test_upload_rejects_without_secret_key(client, auth_ok, monkeypatch):
    monkeypatch.delenv("SUPABASE_SECRET_KEY", raising=False)
    with patch("services.upload_service.supabase") as sb:
        res = client.post(
            "/api/v1/uploads/images",
            headers=AUTH_A,
            data={"file": (BytesIO(JPEG_BYTES), "photo.jpg")},
            content_type="multipart/form-data",
        )
    assert res.status_code == 500
    sb.storage.from_.assert_not_called()


def test_detect_image_formats():
    from utils.image_file import detect_image

    assert detect_image(JPEG_BYTES).mime == "image/jpeg"
    assert detect_image(PNG_BYTES).mime == "image/png"
    webp = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 8
    assert detect_image(webp).mime == "image/webp"
    assert detect_image(b"GIF89a") is None
