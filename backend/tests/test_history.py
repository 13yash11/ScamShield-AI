from uuid import uuid4


def create_scan(client):
    response = client.post(
        "/api/v1/scan/text", json={"text": "Please review this ordinary message tomorrow."}
    )
    assert response.status_code == 200
    return response.json()


def test_history_and_detail(signed_in):
    scan = create_scan(signed_in)
    response = signed_in.get("/api/v1/scans/history")
    assert response.status_code == 200
    assert response.json()[0]["id"] == scan["id"]
    assert response.json()[0]["saved"]
    assert signed_in.get("/api/v1/scans/" + scan["id"]).status_code == 200


def test_delete_own_scan_and_not_other_users(signed_in, provider):
    scan = create_scan(signed_in)
    assert signed_in.delete("/api/v1/scans/" + scan["id"]).status_code == 204
    assert signed_in.get("/api/v1/scans/history").json() == []
    other_scan = {**scan, "id": str(uuid4()), "user_id": provider.other_id}
    provider.scans.append(other_scan)
    assert signed_in.delete("/api/v1/scans/" + other_scan["id"]).status_code == 404
    assert other_scan in provider.scans


def test_history_requires_auth_and_valid_pagination(client):
    assert client.get("/api/v1/scans/history").status_code == 401
    assert client.delete("/api/v1/scans/" + str(uuid4())).status_code == 401


def test_report_ownership(signed_in, provider):
    scan = create_scan(signed_in)
    response = signed_in.post(
        "/api/v1/scans/" + scan["id"] + "/report",
        json={"description": "This sender tried to take a payment."},
    )
    assert response.status_code == 201
    assert len(provider.reports) == 1
    assert (
        signed_in.post(
            "/api/v1/scans/" + str(uuid4()) + "/report",
            json={"description": "Unrelated scan report."},
        ).status_code
        == 404
    )


def test_admin_only_endpoints(signed_in, provider):
    for endpoint in ["metrics", "users", "reports"]:
        assert signed_in.get("/api/v1/admin/" + endpoint).status_code == 403
    provider.admin = True
    for endpoint in ["metrics", "users", "reports"]:
        assert signed_in.get("/api/v1/admin/" + endpoint).status_code == 200
    assert signed_in.get("/api/v1/admin/metrics").json()["totalScans"] == 0


def test_invalid_uuid_and_pagination(signed_in):
    assert signed_in.delete("/api/v1/scans/not-a-uuid").status_code == 422
    assert signed_in.get("/api/v1/scans/history?limit=500").status_code == 422
    assert signed_in.get("/api/v1/scans/history?offset=-1").status_code == 422


def test_history_database_failure(signed_in, provider, monkeypatch):
    original = provider.handle

    def failing_history(request):
        if request.url.path.endswith("/scan_history"):
            return provider.response(500, {"message": "private database error"})
        return original(request)

    monkeypatch.setattr(provider, "handle", failing_history)
    response = signed_in.get("/api/v1/scans/history")
    assert response.status_code == 503
    assert "private database error" not in response.text
    # Analysis can still finish, but must not pretend persistence worked.
    response = signed_in.post(
        "/api/v1/scan/text", json={"text": "A message to scan while storage is down."}
    )
    assert response.status_code == 200
    assert not response.json()["saved"]
    assert response.json()["persistenceError"]
