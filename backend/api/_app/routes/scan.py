import warnings
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from ..core.config import Settings, get_settings
from ..core.security import AuthenticatedUser, optional_user
from ..schemas.results import ScanResult
from ..schemas.scan import TextScanRequest, UrlScanRequest
from ..services.gemini_service import AIOutcome, GeminiService
from ..services.privacy import redact
from ..services.rule_engine import RuleAssessment, assess_text
from ..services.scanning import build_result, privacy_settings, save_result
from ..services.supabase_service import SupabaseService, get_supabase
from ..services.url_analyzer import analyze_url

router = APIRouter(prefix="/api/v1/scan", tags=["Scanning"])


def get_gemini(settings: Settings = Depends(get_settings)) -> GeminiService:
    return GeminiService(settings)


@router.post("/text", response_model=ScanResult)
async def scan_text(
    body: TextScanRequest,
    auth: AuthenticatedUser | None = Depends(optional_user),
    db: SupabaseService = Depends(get_supabase),
    gemini: GeminiService = Depends(get_gemini),
):
    privacy = await privacy_settings(db, auth)
    rules = assess_text(body.text)
    ai = (
        await gemini.analyze(redact(body.text))
        if privacy.use_ai
        else AIOutcome(reason="ai_disabled_by_user")
    )
    result = build_result("text", body.text, rules, ai)
    return await save_result(result, body.text, privacy, auth, db)


@router.post("/url", response_model=ScanResult)
async def scan_url(
    body: UrlScanRequest,
    auth: AuthenticatedUser | None = Depends(optional_user),
    db: SupabaseService = Depends(get_supabase),
    gemini: GeminiService = Depends(get_gemini),
):
    privacy = await privacy_settings(db, auth)
    checked = analyze_url(body.url)
    rules = RuleAssessment(score=checked.score, indicators=checked.indicators)
    ai = (
        await gemini.analyze(
            "Passively assess URL syntax only. No website was visited.\n" + redact(body.url)
        )
        if privacy.use_ai
        else AIOutcome(reason="ai_disabled_by_user")
    )
    result = build_result("url", body.url, rules, ai)
    return await save_result(result, body.url, privacy, auth, db)


def validate_image(data: bytes) -> str:
    formats = {"PNG": "image/png", "JPEG": "image/jpeg", "WEBP": "image/webp"}
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            # Limit decoder selection before parsing untrusted image headers.
            with Image.open(BytesIO(data), formats=list(formats)) as image:
                if image.format not in formats:
                    raise HTTPException(415, "Only PNG, JPEG, and WebP screenshots are supported.")
                if image.width * image.height > 16_000_000 or getattr(image, "n_frames", 1) != 1:
                    raise HTTPException(422, "Use a single screenshot smaller than 16 megapixels.")
                mime = formats[image.format]
                image.verify()
            # Decode actual pixels too; headers and file extensions are insufficient.
            with Image.open(BytesIO(data), formats=list(formats)) as image:
                image.load()
            return mime
    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise HTTPException(415, "The uploaded file is not a valid supported image.") from None


@router.post("/file", response_model=ScanResult)
async def scan_file(
    file: UploadFile = File(...),
    auth: AuthenticatedUser | None = Depends(optional_user),
    db: SupabaseService = Depends(get_supabase),
    gemini: GeminiService = Depends(get_gemini),
    settings: Settings = Depends(get_settings),
):
    try:
        data = await file.read(settings.max_upload_bytes + 1)
    finally:
        await file.close()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(413, "Screenshots must be at most 3 MB.")
    mime = validate_image(data)
    privacy = await privacy_settings(db, auth)
    if not privacy.use_ai:
        raise HTTPException(
            400,
            "Screenshot analysis needs Gemini. Enable AI analysis in privacy settings or paste the message as text.",
        )
    ai = await gemini.analyze(
        "Read the suspicious message in this screenshot. Extract visible message text and URLs, then assess scam indicators.",
        data,
        mime,
    )
    if not ai.assessment:
        raise HTTPException(
            503,
            f"Screenshot could not be analyzed ({ai.reason}). No image assessment was produced. Paste the message as text to use rule-based scanning.",
        )
    if not ai.assessment.image_readable or len(ai.assessment.extracted_text.strip()) < 10:
        raise HTTPException(
            422, "No readable message was found. Upload a clearer screenshot or paste the text."
        )
    text = ai.assessment.extracted_text + "\n" + "\n".join(ai.assessment.visible_urls)
    result = build_result(
        "screenshot", "Uploaded screenshot (image is not retained)", assess_text(text), ai
    )
    return await save_result(result, "Screenshot", privacy, auth, db)
