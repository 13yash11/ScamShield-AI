import json
from io import BytesIO
from types import SimpleNamespace

import httpx
import pytest
from google import genai
from google.genai import errors
from PIL import Image

from backend.api._app.core.config import Settings
from backend.api._app.routes.scan import get_gemini
from backend.api._app.schemas.results import GeminiAssessment
from backend.api._app.services.gemini_service import AIOutcome, GeminiService


def image_bytes(format="PNG"):
    output = BytesIO()
    Image.new("RGB", (30, 30), "white").save(output, format=format)
    return output.getvalue()


def test_text_scan_falls_back_without_ai_and_guest_is_not_saved(client):
    response = client.post(
        "/api/v1/scan/text",
        json={"text": "Urgent: Share your OTP and password to verify your suspended bank account."},
    )
    assert response.status_code == 200
    result = response.json()
    assert result["riskLevel"] == "CRITICAL"
    assert not result["aiUsed"] and not result["saved"]
    assert result["detectionMethod"] == "RULE_BASED_FALLBACK"
    assert result["fallbackReason"] == "ai_not_configured"
    assert result["confidence"] is None


def test_signed_in_scan_is_saved_with_private_reference(signed_in, provider):
    response = signed_in.post(
        "/api/v1/scan/text",
        json={"text": "Can we meet tomorrow? Contact test@example.com or 9876543210."},
    )
    assert response.status_code == 200
    assert response.json()["saved"]
    assert len(provider.scans) == 1
    assert "9876543210" not in str(provider.scans)
    assert "test@example.com" not in str(provider.scans)
    assert "SHA-256" in provider.scans[0]["content_reference"]


def test_disabled_privacy_is_respected(signed_in, provider):
    provider.preferences["privacy_preferences"].update(save_history=False, use_ai=False)
    response = signed_in.post("/api/v1/scan/text", json={"text": "A regular message for analysis."})
    assert response.status_code == 200
    assert response.json()["detectionMethod"] == "RULE_BASED"
    assert not response.json()["saved"]
    assert not provider.scans


@pytest.mark.parametrize(
    "url",
    [
        "javascript://alert(1)",
        "file:///etc/passwd",
        "https://example.com:bad",
        "https://bad host.com",
        "https://example.com\\@evil.com",
    ],
)
def test_invalid_urls(client, url):
    assert client.post("/api/v1/scan/url", json={"url": url}).status_code == 422


def test_url_scanning(client):
    response = client.post(
        "/api/v1/scan/url", json={"url": "http://paypal.secure-login.evil.example/verify-account"}
    )
    assert response.status_code == 200
    assert response.json()["riskScore"] >= 30
    assert "never visited" in response.json()["limitations"]


def test_invalid_text(client):
    for text in ["short", " " * 12, "a" * 8001]:
        assert client.post("/api/v1/scan/text", json={"text": text}).status_code == 422


def test_screenshot_validates_actual_content(client):
    assert (
        client.post(
            "/api/v1/scan/file", files={"file": ("scam.png", b"<script>bad</script>", "image/png")}
        ).status_code
        == 415
    )
    assert (
        client.post(
            "/api/v1/scan/file", files={"file": ("scam.png", image_bytes("GIF"), "image/png")}
        ).status_code
        == 415
    )
    assert (
        client.post(
            "/api/v1/scan/file", files={"file": ("scam.png", image_bytes()[:40], "image/png")}
        ).status_code
        == 415
    )
    assert (
        client.post(
            "/api/v1/scan/file",
            files={"file": ("big.png", b"a" * (3 * 1024 * 1024 + 1), "image/png")},
        ).status_code
        == 413
    )


def test_screenshot_cannot_fabricate_fallback(client):
    response = client.post(
        "/api/v1/scan/file", files={"file": ("screen.png", image_bytes(), "image/png")}
    )
    assert response.status_code == 503
    assert "No image assessment" in response.json()["detail"]
    assert "riskScore" not in response.json()


def test_unsupported_image_decoder_is_never_invoked(client, monkeypatch):
    data = image_bytes("BMP")
    Image.init()
    _, accept = Image.OPEN["BMP"]

    def unsupported_decoder(*_args, **_kwargs):
        pytest.fail("An unsupported image decoder was invoked before rejecting the upload")

    monkeypatch.setitem(Image.OPEN, "BMP", (unsupported_decoder, accept))
    response = client.post(
        "/api/v1/scan/file", files={"file": ("disguised.png", data, "image/png")}
    )
    assert response.status_code == 415


def assessment(**updates):
    return GeminiAssessment(
        riskLevel="LOW",
        riskScore=95,
        suspiciousIndicators=["A sensitive code is requested"],
        explanation="The sender asks for a verification code.",
        recommendations=["Do not share the code."],
        extractedText="Please share your OTP immediately to verify your suspended bank account.",
        imageReadable=True,
        **updates,
    )


@pytest.mark.parametrize(
    ("format", "mime"), [("PNG", "image/jpeg"), ("JPEG", "image/jpeg"), ("WEBP", "image/webp")]
)
def test_successful_screenshot_uses_real_ai_result_and_rules(client, format, mime):
    class AI:
        async def analyze(self, *_args):
            return AIOutcome(assessment())

    client.app.dependency_overrides[get_gemini] = lambda: AI()
    response = client.post(
        "/api/v1/scan/file", files={"file": ("screen.png", image_bytes(format), mime)}
    )
    assert response.status_code == 200
    assert response.json()["aiUsed"]
    # Model's inconsistent LOW label is ignored in favor of server thresholds.
    assert response.json()["riskLevel"] in {"HIGH", "CRITICAL"}


@pytest.mark.parametrize("with_image", [False, True])
async def test_gemini_structured_request_uses_supported_json_schema(monkeypatch, with_image):
    """Exercise real SDK serialization, not just a mocked generate_content method."""
    requests = []

    def provider(request):
        body = json.loads(request.content)
        requests.append(body)
        config = body["generationConfig"]
        if "responseSchema" in config:
            return httpx.Response(
                400,
                json={
                    "error": {
                        "code": 400,
                        "status": "INVALID_ARGUMENT",
                        "message": "Unknown name additional_properties at generation_config.response_schema",
                    }
                },
            )
        schema = config["responseJsonSchema"]
        assert schema["additionalProperties"] is False
        assert "riskScore" in schema["required"]
        assert "test-only-key" not in request.content.decode()
        return httpx.Response(
            200,
            json={
                "candidates": [
                    {
                        "content": {
                            "role": "model",
                            "parts": [{"text": assessment().model_dump_json(by_alias=True)}],
                        },
                        "finishReason": "STOP",
                    }
                ]
            },
        )

    real_client = genai.Client

    def mock_transport_client(**kwargs):
        options = kwargs["http_options"].model_copy(
            update={
                "httpx_async_client": httpx.AsyncClient(transport=httpx.MockTransport(provider))
            }
        )
        return real_client(api_key=kwargs["api_key"], http_options=options)

    monkeypatch.setattr("backend.api._app.services.gemini_service.genai.Client", mock_transport_client)
    outcome = await GeminiService(Settings(_env_file=None, gemini_api_key="test-only-key")).analyze(
        "Synthetic test message requesting an OTP.",
        image_bytes() if with_image else None,
        "image/png" if with_image else None,
    )
    assert len(requests) == 1
    assert outcome.assessment is not None
    assert outcome.reason is None
    assert outcome.assessment.risk_score == 95


@pytest.mark.parametrize(
    ("behavior", "reason"),
    [
        ("timeout", "ai_timeout"),
        ("invalid", "invalid_ai_response"),
        ("quota", "ai_rate_limited"),
        ("model", "ai_model_unavailable"),
        ("request", "ai_request_rejected"),
        ("access", "ai_access_denied"),
    ],
)
async def test_gemini_sdk_failure_paths(monkeypatch, behavior, reason):
    class AI:
        models = None

        def __init__(self):
            self.models = self

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            pass

        async def generate_content(self, **_kwargs):
            if behavior == "timeout":
                raise TimeoutError()
            if behavior in {"quota", "model", "request", "access"}:
                raise errors.ClientError(
                    {"quota": 429, "model": 404, "request": 400, "access": 403}[behavior],
                    {"error": {"message": "provider error"}},
                )
            return SimpleNamespace(text='{"riskScore":101}')

    class Client:
        def __init__(self, **_kwargs):
            self.aio = AI()

        def close(self):
            pass

    monkeypatch.setattr("backend.api._app.services.gemini_service.genai.Client", Client)
    service = GeminiService(Settings(gemini_api_key="test-only-key"))
    outcome = await service.analyze("suspicious message")
    assert outcome.assessment is None
    assert outcome.reason == reason
