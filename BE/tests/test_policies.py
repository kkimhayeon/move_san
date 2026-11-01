from __future__ import annotations

from unittest.mock import MagicMock, patch

from schemas.policy_schema import POLICY_CATEGORIES


def _row(**overrides):
    row = {
        "policy_id": 1,
        "policy_name": "청년 월세 지원",
        "category": "정책",
        "description": "설명",
        "benefit_description": "혜택 설명",
        "period_description": "상시",
        "eligibility_description": "청년",
        "interest_rate_description": None,
        "official_url": "https://example.com/policy",
        "is_visible": True,
    }
    row.update(overrides)
    return row


def _mock_query(sb, data):
    chain = MagicMock()
    sb.table.return_value.select.return_value = chain
    chain.eq.return_value = chain
    chain.not_ = MagicMock()
    chain.not_.is_.return_value = chain
    chain.neq.return_value = chain
    chain.ilike.return_value = chain
    chain.order.return_value.execute.return_value = MagicMock(data=data)
    return chain


def test_list_all_policies(client):
    rows = [
        _row(policy_id=1, category="정책"),
        _row(policy_id=2, category="금융상품", policy_name="예금"),
        _row(policy_id=3, category="문화 및 모임 활동", policy_name="모임"),
    ]
    with patch("services.policy_service.supabase") as sb:
        _mock_query(sb, rows)
        res = client.get("/api/v1/policies")
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert body["result"]["total"] == 3
    assert len(body["result"]["items"]) == 3
    assert body["result"]["items"][0]["policy_id"] == 1
    assert "page" not in body["result"]


def test_list_by_each_category(client):
    for category in POLICY_CATEGORIES:
        with patch("services.policy_service.supabase") as sb:
            chain = _mock_query(sb, [_row(category=category)])
            res = client.get(f"/api/v1/policies?category={category}")
        assert res.status_code == 200
        assert res.get_json()["result"]["items"][0]["category"] == category
        chain.eq.assert_any_call("category", category)


def test_search_and_category_combination(client):
    with patch("services.policy_service.supabase") as sb:
        chain = _mock_query(sb, [_row(policy_name="부산 청년")])
        res = client.get("/api/v1/policies?category=정책&q=%20부산%20")
    assert res.status_code == 200
    chain.eq.assert_any_call("category", "정책")
    chain.ilike.assert_called_once_with("policy_name", "%부산%")
    assert res.get_json()["result"]["total"] == 1


def test_invalid_category_400(client):
    res = client.get("/api/v1/policies?category=없는카테고리")
    assert res.status_code == 400
    body = res.get_json()
    assert body["status"] == 400
    assert body["result"] is None
    assert "카테고리" in body["message"]


def test_blank_category_and_q_mean_no_filter(client):
    with patch("services.policy_service.supabase") as sb:
        chain = _mock_query(sb, [])
        res = client.get("/api/v1/policies?category=%20%20&q=%20")
    assert res.status_code == 200
    # is_visible 필터만, category/ilike 미적용
    category_calls = [c for c in chain.eq.call_args_list if c.args[0] == "category"]
    assert category_calls == []
    chain.ilike.assert_not_called()


def test_empty_list_200(client):
    with patch("services.policy_service.supabase") as sb:
        _mock_query(sb, [])
        res = client.get("/api/v1/policies?q=없는검색어xyz")
    assert res.status_code == 200
    body = res.get_json()["result"]
    assert body["items"] == []
    assert body["total"] == 0


def test_excludes_invisible_and_blank_url_in_query(client):
    with patch("services.policy_service.supabase") as sb:
        chain = _mock_query(sb, [])
        client.get("/api/v1/policies")
    chain.eq.assert_any_call("is_visible", True)
    chain.not_.is_.assert_called_with("official_url", "null")
    chain.neq.assert_called_with("official_url", "")


def test_excludes_whitespace_url_in_response(client):
    with patch("services.policy_service.supabase") as sb:
        _mock_query(
            sb,
            [
                _row(policy_id=1, official_url="https://ok.example"),
                _row(policy_id=2, official_url="   "),
            ],
        )
        res = client.get("/api/v1/policies")
    items = res.get_json()["result"]["items"]
    assert len(items) == 1
    assert items[0]["policy_id"] == 1


def test_nullable_fields_preserved(client):
    with patch("services.policy_service.supabase") as sb:
        _mock_query(
            sb,
            [
                _row(
                    benefit_description=None,
                    period_description=None,
                    eligibility_description=None,
                    interest_rate_description=None,
                )
            ],
        )
        res = client.get("/api/v1/policies")
    item = res.get_json()["result"]["items"][0]
    assert item["benefit_description"] is None
    assert item["period_description"] is None
    assert item["eligibility_description"] is None
    assert item["interest_rate_description"] is None


def test_categories_fixed_order(client):
    res = client.get("/api/v1/policies/categories")
    assert res.status_code == 200
    body = res.get_json()
    assert body["result"]["categories"] == [
        "정책",
        "금융상품",
        "문화 및 모임 활동",
    ]


def test_db_error_500(client):
    with patch("services.policy_service.supabase") as sb:
        sb.table.side_effect = RuntimeError("db down")
        res = client.get("/api/v1/policies")
    assert res.status_code == 500
    body = res.get_json()
    assert body["result"] is None
    assert "db down" not in (body["message"] or "")


def test_orders_by_policy_id(client):
    with patch("services.policy_service.supabase") as sb:
        chain = _mock_query(sb, [])
        client.get("/api/v1/policies")
    chain.order.assert_called_with("policy_id")


def test_favorite_stubs_remain_on_v1(client):
    res = client.put("/api/v1/policies/1/favorite")
    assert res.status_code == 501
    res = client.delete("/api/v1/policies/1/favorite")
    assert res.status_code == 501
