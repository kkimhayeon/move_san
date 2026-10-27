from services.user_service import ProfileNotFoundError


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_get_me_without_token(client):
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401
    body = res.get_json()
    assert body["status"] == 401
    assert body["result"] is None


def test_get_me_success(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "utils.auth.verify_token",
        lambda _token: {"user_id": "11111111-1111-4111-8111-111111111111", "email": "a@b.com"},
    )
    monkeypatch.setattr(
        "routers.v1.users.get_me",
        lambda _user_id: {
            "id": "11111111-1111-4111-8111-111111111111",
            "nickname": "부산살림사용자",
            "created_at": "2026-10-26T07:00:00Z",
        },
    )
    res = client.get("/api/v1/users/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert body["result"]["nickname"] == "부산살림사용자"


def test_get_me_profile_missing(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "utils.auth.verify_token",
        lambda _token: {"user_id": "11111111-1111-4111-8111-111111111111", "email": None},
    )

    def _missing(_user_id):
        raise ProfileNotFoundError(_user_id)

    monkeypatch.setattr("routers.v1.users.get_me", _missing)
    res = client.get("/api/v1/users/me", headers=auth_headers)
    assert res.status_code == 404
    assert res.get_json()["result"] is None
