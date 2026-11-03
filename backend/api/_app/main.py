from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import Settings, get_settings
from .core.middleware import SecurityMiddleware
from .routes import admin, auth, history, scan
from .routes import settings as settings_routes


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(
        title="ScamShield AI",
        version="1.0.0",
        docs_url=None if settings.production else "/api/docs",
        openapi_url=None if settings.production else "/api/openapi.json",
    )
    app.dependency_overrides[get_settings] = lambda: settings

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        # Pydantic's default errors include the submitted input, possibly passwords.
        messages = [
            f"{'.'.join(str(p) for p in error['loc'][1:]) or 'request'}: {error['msg']}"
            for error in exc.errors()
        ]
        return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, _exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected server error occurred. Please try again."},
        )

    @app.get("/api/health")
    async def health():
        return {
            "status": "ok",
            "service": "scamshield-api",
            "supabaseConfigured": settings.supabase_configured,
            "geminiConfigured": bool(settings.gemini_api_key.get_secret_value()),
        }

    app.include_router(auth.router)
    app.include_router(settings_routes.router)
    app.include_router(scan.router)
    app.include_router(history.router)
    app.include_router(admin.router)

    app.add_middleware(SecurityMiddleware, settings=settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-ScamShield-Session"],
    )
    return app


app = create_app()
