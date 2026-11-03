from datetime import datetime, timezone
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.api._app.core.config import Settings
from backend.api._app.main import create_app
from backend.api._app.services.supabase_service import SupabaseService, get_supabase

PASSWORD = "Test password 123!"


class FakeSupabase:
    """HTTP boundary mock: the production Auth/REST client remains under test."""

    def __init__(self):
        self.user_id = str(uuid4())
        self.other_id = str(uuid4())
        self.token = "test-access-token"
        self.revoked = False
        self.admin = False
        self.outage = False
        self.duplicate = False
        self.scans = []
        self.reports = []
        self.calls = []
        self.profile = {
            "id": self.user_id,
            "full_name": "Test User",
            "email": "test@example.com",
            "phone_number": "+919876543210",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.preferences = {
            "notification_preferences": {"security_notices": True},
            "privacy_preferences": {"save_history": True, "store_content": False, "use_ai": True},
        }

    def response(self, status=200, data=None):
        return httpx.Response(status, json=data if data is not None else {})

    def handle(self, request):
        import json

        path, method = request.url.path, request.method
        data = json.loads(request.content) if request.content else {}
        self.calls.append((method, path))
        if self.outage:
            return self.response(500, {"message": "sensitive provider debug data"})
        if path.endswith("/signup"):
            return self.response(
                data={
                    "id": str(uuid4()),
                    "identities": [] if self.duplicate else [{"provider": "email"}],
                }
            )
        if path.endswith("/token"):
            grant = request.url.params.get("grant_type")
            if grant == "password" and (
                data.get("password") != PASSWORD or data.get("email") != self.profile["email"]
            ):
                return self.response(400, {"error_code": "invalid_credentials"})
            if grant == "refresh_token" and (
                data.get("refresh_token") != "test-refresh-token" or self.revoked
            ):
                return self.response(400, {"error_code": "refresh_token_not_found"})
            self.revoked = False
            return self.response(
                data={
                    "access_token": self.token,
                    "refresh_token": "test-refresh-token",
                    "expires_in": 3600,
                }
            )
        if path.endswith("/recover"):
            return self.response(data={})
        if request.headers.get("authorization") != f"Bearer {self.token}":
            return self.response(401, {"message": "invalid token"})
        if path == "/auth/v1/logout":
            self.revoked = True
            return httpx.Response(204)
        if path == "/auth/v1/user":
            if method == "PUT":
                self.profile.update(data.get("data", {}))
            return self.response(
                data={
                    "id": self.user_id,
                    "email": self.profile["email"],
                    "email_confirmed_at": "2026-01-01T00:00:00Z",
                }
            )
        if path.endswith("/rpc/session_is_active"):
            return self.response(data=not self.revoked)
        if path.endswith("/profiles"):
            return self.response(data=[{**self.profile, "role": "admin" if self.admin else "user"}])
        if path.endswith("/user_settings"):
            if method == "PATCH":
                self.preferences.update(data)
                return httpx.Response(204)
            return self.response(data=[self.preferences])
        if path.endswith("/scan_history"):
            if method == "POST":
                self.scans.append(data)
                return self.response(201, [data])
            records = [r for r in self.scans if r["user_id"] == self.user_id]
            scan_id = request.url.params.get("id", "").removeprefix("eq.")
            if scan_id:
                records = [r for r in records if r["id"] == scan_id]
            if method == "DELETE":
                self.scans = [r for r in self.scans if r not in records]
            return self.response(data=records)
        if path.endswith("/rpc/admin_metrics"):
            return self.response(
                data={
                    "totalScans": len(self.scans),
                    "flaggedThreats": 0,
                    "activeUsers": 1,
                    "reportedScamsCount": len(self.reports),
                }
            )
        if path.endswith("/scam_reports"):
            if method == "POST":
                self.reports.append(
                    {
                        "id": str(uuid4()),
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "status": "PENDING_REVIEW",
                        **data,
                    }
                )
            return self.response(data=self.reports)
        raise AssertionError(f"Unhandled provider request: {method} {path}")


@pytest.fixture
def provider():
    return FakeSupabase()


@pytest.fixture
def client(provider):
    settings = Settings(
        _env_file=None,
        app_env="development",
        app_origin="http://localhost:5173",
        cors_origins="",
        supabase_url="https://project.supabase.co",
        supabase_publishable_key="test-publishable-key",
        gemini_api_key="",
    )
    app = create_app(settings)

    async def mock_db():
        async with httpx.AsyncClient(transport=httpx.MockTransport(provider.handle)) as http:
            yield SupabaseService(settings, http)

    app.dependency_overrides[get_supabase] = mock_db
    with TestClient(app, headers={"Origin": "http://localhost:5173"}) as test_client:
        yield test_client


@pytest.fixture
def signed_in(client, provider):
    client.headers["Authorization"] = f"Bearer {provider.token}"
    return client
