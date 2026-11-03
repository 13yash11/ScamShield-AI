from datetime import datetime, timezone
from typing import Literal
from uuid import UUID, uuid4

from pydantic import Field, StrictInt, constr

from .auth import ApiModel

RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
ScanType = Literal["text", "url", "screenshot"]


def risk_level(score: int) -> RiskLevel:
    if score >= 85:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


class GeminiAssessment(ApiModel):
    # Scores and labels are checked/recomputed by the server after validation.
    risk_level: RiskLevel
    risk_score: StrictInt = Field(ge=0, le=100)
    suspicious_indicators: list[constr(min_length=1, max_length=300)] = Field(max_length=15)
    explanation: str = Field(min_length=10, max_length=3000)
    recommendations: list[constr(min_length=1, max_length=300)] = Field(min_length=1, max_length=10)
    extracted_text: str = Field(default="", max_length=8000)
    visible_urls: list[constr(max_length=2048)] = Field(default_factory=list, max_length=10)
    image_readable: bool = False


class ScanResult(ApiModel):
    id: UUID = Field(default_factory=uuid4)
    scan_type: ScanType
    target: str
    risk_level: RiskLevel
    risk_score: int = Field(ge=0, le=100)
    confidence: None = None
    summary: str
    warning_signs: list[str]
    suspicious_phrases: list[str] = Field(default_factory=list)
    explanation: str
    recommendations: list[str]
    detection_method: str
    limitations: str
    ai_used: bool = False
    fallback_reason: str | None = None
    saved: bool = False
    persistence_error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
