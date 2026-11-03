import pytest

from .conftest import PASSWORD

SIGNUP = {
    "fullName": "Test User",
    "email": "test@example.com",
    "phoneNumber": "9876543210",
    "password": PASSWORD,
    "rePassword": PASSWORD,
}


def test_signup_success_requires_confirmation(client):
    response = client.post("/api/v1/auth/signup", json=SIGNUP)
    assert response.status_code == 201
    assert response.json()["requiresConfirmation"]
    assert "password" not in response.text.lower()
    assert "scamshield_access" not in client.cookies


@pytest.mark.parametrize(
    ("path", "code"),
    [("/rest/v1/rpc/session_is_active", "PGRST202"), ("/rest/v1/profiles", "PGRST205")],
)
def test_login_explains_missing_database_setup_without_establishing_session(
    client, provider, monkeypatch, path, code
):
    original = provider.handle

    def missing_database_object(request):
        if request.url.path == path:
            return provider.response(404, {"code": code, "message": "provider debug details"})
        return original(request)

    monkeypatch.setattr(provider, "handle", missing_database_object)
    response = client.post(
        "/api/v1/auth/login", json={"identifier": "test@example.com", "password": PASSWORD}
    )
    assert response.status_code == 503
    assert "Database setup is incomplete" in response.json()["detail"]
    assert "provider debug details" not in response.text
    assert "scamshield_access" not in client.cookies


def test_duplicate_registration_is_not_success(client, provider):
    provider.duplicate = True
    assert client.post("/api/v1/auth/signup", json=SIGNUP).status_code == 409


def test_invalid_registration_never_echoes_password(client):
    for change in [
        {"email": "bad"},
        {"phoneNumber": "+15551234567"},
        {"password": "short"},
        {"rePassword": "mismatch"},
        {"role": "admin"},
    ]:
        response = client.post("/api/v1/auth/signup", json={**SIGNUP, **change})
        assert response.status_code == 422
        assert PASSWORD not in response.text


def test_login_sets_http_only_cookies_and_me(client):
    response = client.post(
        "/api/v1/auth/login", json={"identifier": "test@example.com", "password": PASSWORD}
    )
    assert response.status_code == 200
    assert response.json()["user"]["fullName"] == "Test User"
    assert "token" not in response.json()
    assert all(
        "HttpOnly" in c and "SameSite=lax" in c for c in response.headers.get_list("set-cookie")
    )
    assert client.get("/api/v1/auth/me").status_code == 200
    assert client.post("/api/v1/auth/refresh").status_code == 200


def test_wrong_password_and_phone_are_generic(client, provider):
    wrong = client.post(
        "/api/v1/auth/login", json={"identifier": "test@example.com", "password": "wrong"}
    )
    for phone in ["9876543210", "+919123456789"]:
        response = client.post(
            "/api/v1/auth/login", json={"identifier": phone, "password": PASSWORD}
        )
        assert response.status_code == wrong.status_code == 401
        assert response.json() == wrong.json()
    assert not client.cookies


def test_unauthorized_and_forged_bearer(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    assert (
        client.get("/api/v1/auth/me", headers={"Authorization": "Bearer forged"}).status_code == 401
    )


def test_logout_clears_cookies_and_revokes_session(client, provider):
    client.post("/api/v1/auth/login", json={"identifier": "test@example.com", "password": PASSWORD})
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert not client.cookies
    assert (
        client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {provider.token}"}
        ).status_code
        == 401
    )


def test_provider_failure_is_sanitized(signed_in, provider):
    provider.outage = True
    response = signed_in.get("/api/v1/auth/me")
    assert response.status_code == 503
    assert "sensitive" not in response.text


def test_settings_update_and_role_injection(signed_in):
    assert signed_in.get("/api/v1/settings").status_code == 200
    response = signed_in.patch(
        "/api/v1/settings",
        json={"privacyPreferences": {"saveHistory": False, "useAi": False, "storeContent": False}},
    )
    assert response.status_code == 200
    assert response.json()["privacyPreferences"]["saveHistory"] is False
    response = signed_in.patch(
        "/api/v1/settings",
        json={
            "profile": {
                "fullName": "Updated Name",
                "email": "test@example.com",
                "phoneNumber": "9876543210",
            }
        },
    )
    assert response.status_code == 200
    assert response.json()["user"]["fullName"] == "Updated Name"
    response = signed_in.patch(
        "/api/v1/settings",
        json={
            "profile": {
                "fullName": "Admin",
                "email": "test@example.com",
                "phoneNumber": "9876543210",
                "role": "admin",
            }
        },
    )
    assert response.status_code == 422


def test_cookie_write_requires_origin(client):
    client.cookies.set("scamshield_access", "test-access-token")
    client.headers.pop("origin")
    assert client.post("/api/v1/auth/logout").status_code == 403


def test_partial_settings_patch_preserves_existing_privacy(signed_in, provider):
    provider.preferences["privacy_preferences"]["use_ai"] = False
    response = signed_in.patch(
        "/api/v1/settings", json={"privacyPreferences": {"saveHistory": False}}
    )
    assert response.status_code == 200
    assert response.json()["privacyPreferences"]["useAi"] is False


def test_password_change_checks_current_password(signed_in):
    response = signed_in.post(
        "/api/v1/auth/password",
        json={
            "currentPassword": "wrong",
            "newPassword": "Another long password!",
            "confirmPassword": "Another long password!",
        },
    )
    assert response.status_code == 400
    response = signed_in.post(
        "/api/v1/auth/password",
        json={
            "currentPassword": PASSWORD,
            "newPassword": "Another long password!",
            "confirmPassword": "Another long password!",
        },
    )
    assert response.status_code == 200


def test_forgot_and_reset_password(client, provider):
    response = client.post("/api/v1/auth/forgot-password", json={"email": "unknown@example.com"})
    assert response.status_code == 200
    assert "If that account exists" in response.json()["message"]
    response = client.post(
        "/api/v1/auth/reset-password",
        json={
            "accessToken": provider.token,
            "newPassword": "A new long password!",
            "confirmPassword": "A new long password!",
        },
    )
    assert response.status_code == 200


def test_logout_provider_failure_still_clears_cookies(client, provider):
    client.post("/api/v1/auth/login", json={"identifier": "test@example.com", "password": PASSWORD})
    provider.outage = True
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 503
    assert not client.cookies
