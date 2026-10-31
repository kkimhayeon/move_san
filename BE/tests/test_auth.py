from services.auth_service import AuthError


def test_verify_without_token(client):
    res = client.get("/api/v1/auth/verify")
    assert res.status_code == 401
    body = res.get_json()
    assert body["status"] == 401
    assert body["result"] is None


def test_verify_with_invalid_token(client, auth_headers, monkeypatch):
    def _fail(_token):
        raise AuthError("invalid")

    monkeypatch.setattr("routers.v1.auth.verify_token", _fail)
    res = client.get("/api/v1/auth/verify", headers=auth_headers)
    assert res.status_code == 401
    assert res.get_json()["result"] is None


def test_verify_success(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "routers.v1.auth.verify_token",
        lambda _token: {"user_id": "11111111-1111-4111-8111-111111111111", "email": "a@b.com"},
    )
    res = client.get("/api/v1/auth/verify", headers=auth_headers)
    assert res.status_code == 200
    body = res.get_json()
    assert body["status"] == 200
    assert body["result"]["user_id"] == "11111111-1111-4111-8111-111111111111"
    assert body["result"]["email"] == "a@b.com"
