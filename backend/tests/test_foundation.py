from fastapi.testclient import TestClient

from backend.api._app.main import create_app


def test_health():
    with TestClient(create_app()) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.headers["cache-control"] == "no-store"


def test_rejects_untrusted_write_origin():
    with TestClient(create_app()) as client:
        response = client.post(
            "/api/v1/auth/login", headers={"Origin": "https://untrusted.example"}, json={}
        )
    assert response.status_code == 403
