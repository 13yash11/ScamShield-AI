import socket

import pytest

from backend.api._app.schemas.results import risk_level
from backend.api._app.services.rule_engine import assess_text
from backend.api._app.services.url_analyzer import analyze_url


def test_otp_bank_suspension_scam_is_high_or_critical():
    result = assess_text(
        "URGENT: Your SBI bank account is suspended. Share your OTP and password immediately to verify https://bit.ly/kyc"
    )
    assert result.score >= 85
    assert any("OTP" in indicator for indicator in result.indicators)


def test_safety_advice_and_normal_message_are_not_definitive_fraud():
    assert (
        assess_text("Never share your OTP or password. Do not click links from strangers.").score
        < 30
    )
    assert assess_text("The bank branch opens at ten tomorrow. See you there.").score < 30
    assert assess_text("OTP is a security code.").score < 30


def test_job_advance_fee_and_lottery():
    assert (
        assess_text("You won the lottery prize money! Pay a processing fee now to collect.").score
        >= 30
    )
    assert (
        assess_text("Job offer: pay registration fee immediately to confirm employment.").score
        >= 60
    )


def test_urls_are_never_visited(monkeypatch):
    def no_network(*_args, **_kwargs):
        raise AssertionError("URL analysis must not use DNS or sockets")

    monkeypatch.setattr(socket, "getaddrinfo", no_network)
    monkeypatch.setattr(socket, "create_connection", no_network)
    assert analyze_url("http://127.0.0.1/secure-login").score >= 40
    assert analyze_url("https://google.com.evil.example/verify-account").score >= 30
    assert analyze_url("https://paypa1.example/secure-login").score >= 30
    assert analyze_url("https://accounts.google.com/").score == 0
    assert analyze_url("https://example.com/").score == 0


@pytest.mark.parametrize(
    ("score", "level"),
    [
        (0, "LOW"),
        (29, "LOW"),
        (30, "MEDIUM"),
        (59, "MEDIUM"),
        (60, "HIGH"),
        (84, "HIGH"),
        (85, "CRITICAL"),
        (100, "CRITICAL"),
    ],
)
def test_consistent_risk_thresholds(score, level):
    assert risk_level(score) == level
