from fastapi import HTTPException

from ..core.security import AuthenticatedUser
from ..schemas.results import ScanResult, risk_level
from ..schemas.settings import PrivacyPreferences
from ..services.gemini_service import AIOutcome
from ..services.privacy import content_reference, redact
from ..services.rule_engine import RuleAssessment
from ..services.supabase_service import SupabaseService

LIMITATIONS = "Scores are heuristic assessments, not statistically calibrated probabilities. Low risk does not guarantee safety. URLs are never visited; live reputation, redirects, and sender ownership are not checked. Redaction is best-effort; remove personal data before submission."


def build_result(scan_type: str, target: str, rules: RuleAssessment, ai: AIOutcome) -> ScanResult:
    model = ai.assessment
    indicators = list(rules.indicators)
    recommendations = [
        "Verify the sender using an independently known official app, website, or contact.",
        "Do not share passwords, PINs, or OTPs or make payments to an unverified recipient.",
    ]
    score = rules.score
    explanation = "The rule engine starts at 5 points for text and 0 for URLs, then adds contextual weights. In text, only the highest-scoring URL contributes, capped at 35 points even if several URL warnings are listed. Text scores are capped at 100 and URL-rule scores at 90. Multiple indicators strengthen concern; individual keywords do not prove fraud."
    if model:
        # Gemini cannot erase a rule signal. Its unsupported score alone cannot
        # raise the final score; validated indicators are required for influence.
        ai_score = model.risk_score if model.suspicious_indicators else 0
        score = max(score, round(0.6 * score + 0.4 * ai_score))
        indicators += [redact(v) for v in model.suspicious_indicators]
        recommendations = list(
            dict.fromkeys([redact(v) for v in model.recommendations] + recommendations)
        )
        explanation += " Gemini provided contextual analysis: " + redact(model.explanation)
        explanation += (
            " Final score is the greater of the rule score and a 60% rules / 40% AI blend."
        )
    level = risk_level(score)
    return ScanResult(
        scan_type=scan_type,
        target=redact(target),
        risk_score=score,
        risk_level=level,
        summary=f"{level.title()} heuristic risk: {len(indicators)} potential warning sign(s). Verify independently.",
        warning_signs=list(dict.fromkeys(indicators)),
        suspicious_phrases=rules.phrases,
        explanation=explanation,
        recommendations=recommendations,
        detection_method="HYBRID_GEMINI_RULES"
        if model
        else "RULE_BASED"
        if ai.reason == "ai_disabled_by_user"
        else "RULE_BASED_FALLBACK",
        limitations=LIMITATIONS
        + (
            " Gemini was not used: " + (ai.reason or "unavailable") + "."
            if not model
            else " AI output can contain mistakes."
        ),
        ai_used=bool(model),
        fallback_reason=ai.reason,
    )


async def privacy_settings(
    db: SupabaseService, auth: AuthenticatedUser | None
) -> PrivacyPreferences:
    if auth is None:
        return PrivacyPreferences(save_history=False)
    rows = await db.table(
        "GET",
        "user_settings",
        auth.token,
        params={"user_id": f"eq.{auth.user.id}", "select": "privacy_preferences", "limit": "1"},
    )
    if not rows:
        raise HTTPException(
            503, "Privacy settings could not be loaded. Check the Supabase migration."
        )
    return PrivacyPreferences.model_validate(rows[0]["privacy_preferences"])


async def save_result(
    result: ScanResult,
    original: str,
    privacy: PrivacyPreferences,
    auth: AuthenticatedUser | None,
    db: SupabaseService,
) -> ScanResult:
    if not auth or not privacy.save_history:
        return result
    row = result.model_dump(mode="json", exclude={"target", "saved", "persistence_error"})
    row.update(
        user_id=str(auth.user.id),
        content_reference=content_reference(original, result.scan_type, privacy.store_content),
    )
    try:
        await db.table("POST", "scan_history", auth.token, json=row, prefer="return=minimal")
        result.saved = True
    except HTTPException:
        result.persistence_error = "Analysis completed, but scan history could not be saved. Please try a new scan after the database is available."
    return result


def row_to_result(row: dict) -> ScanResult:
    fields = {key: value for key, value in row.items() if key in ScanResult.model_fields}
    return ScanResult(**fields, target=row["content_reference"], saved=True)
