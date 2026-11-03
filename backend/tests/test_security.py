import pytest
from pydantic import ValidationError

from backend.api._app.core.config import Settings
from backend.api._app.core.security import set_session
from backend.api._app.main import create_app


def test_production_cookies_are_secure():
    from fastapi import Response

    settings = Settings(
        _env_file=None,
        app_env="production",
        app_origin="https://app.example",
        cors_origins="https://app.example",
    )
    response = Response()
    set_session(
        response,
        {"access_token": "test-access", "refresh_token": "test-refresh", "expires_in": 3600},
        settings,
    )
    cookies = response.headers.getlist("set-cookie")
    assert len(cookies) == 2
    assert all(
        "Secure" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
        for cookie in cookies
    )


def test_rejects_wildcard_cors_and_insecure_production():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, cors_origins="*")
    with pytest.raises(ValidationError):
        Settings(_env_file=None, app_env="production", app_origin="http://localhost:5173")


def test_rate_limit_is_enforced(client):
    for _ in range(10):
        assert (
            client.post(
                "/api/v1/scan/text", json={"text": "Ordinary message for a bounded test."}
            ).status_code
            == 200
        )
    response = client.post("/api/v1/scan/text", json={"text": "Another message after the limit."})
    assert response.status_code == 429
    assert response.headers["retry-after"] == "60"


def test_cors_preflight_rejects_unknown_origin(client):
    response = client.options(
        "/api/v1/scan/text",
        headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "POST"},
    )
    assert response.status_code == 400
    assert response.headers.get("access-control-allow-origin") != "*"


@pytest.mark.parametrize("origin", ["http://localhost:5173", "http://127.0.0.1:5173"])
def test_development_accepts_both_vite_loopback_addresses(origin):
    from fastapi.testclient import TestClient

    settings = Settings(
        _env_file=None,
        app_env="development",
        app_origin="http://localhost:5173",
        cors_origins="",
        supabase_url="",
        supabase_publishable_key="",
        gemini_api_key="",
    )
    with TestClient(create_app(settings)) as client:
        # Empty signup input reaches validation without contacting Supabase.
        response = client.post("/api/v1/auth/signup", headers={"Origin": origin}, json={})
        assert response.status_code == 422
        assert response.headers["access-control-allow-origin"] == origin


def test_production_does_not_automatically_allow_loopback_or_unknown_sites():
    from fastapi.testclient import TestClient

    settings = Settings(
        _env_file=None,
        app_env="production",
        app_origin="https://app.example",
        cors_origins="",
        supabase_url="",
        supabase_publishable_key="",
        gemini_api_key="",
    )
    assert settings.allowed_origins == ["https://app.example"]
    with TestClient(create_app(settings)) as client:
        for origin in [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://untrusted.example",
        ]:
            response = client.post("/api/v1/auth/signup", headers={"Origin": origin}, json={})
            assert response.status_code == 403


def test_development_aliases_do_not_allow_arbitrary_ports():
    settings = Settings(
        _env_file=None,
        app_env="development",
        app_origin="http://localhost:5173",
        cors_origins="",
    )
    assert "http://127.0.0.1:5174" not in settings.allowed_origins
