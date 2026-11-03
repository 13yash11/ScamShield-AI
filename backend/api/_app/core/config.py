import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    app_env: str = "production" if os.getenv("VERCEL") else "development"
    app_origin: str = "http://localhost:5173"
    cors_origins: str = ""
    supabase_url: str = ""
    supabase_publishable_key: SecretStr = SecretStr("")
    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_timeout_seconds: float = Field(default=18, ge=1, le=25)
    max_upload_bytes: int = Field(default=3 * 1024 * 1024, ge=1024, le=3 * 1024 * 1024)
    scan_rate_limit: int = Field(default=10, ge=1, le=100)
    auth_rate_limit: int = Field(default=15, ge=1, le=100)

    @field_validator("app_origin", "supabase_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value:
            return value
        parsed = urlsplit(value)
        if parsed.scheme not in {"https", "http"} or not parsed.hostname:
            raise ValueError("Use an HTTP(S) origin")
        if (
            parsed.username
            or parsed.password
            or parsed.query
            or parsed.fragment
            or parsed.path not in {"", "/"}
        ):
            raise ValueError("Use an origin without a path, credentials, query, or fragment")
        if parsed.scheme == "http" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("HTTPS is required outside local development")
        return value.rstrip("/")

    @model_validator(mode="after")
    def validate_origins(self):
        for origin in self.allowed_origins:
            self.validate_url(origin)
        if self.production and not self.app_origin.startswith("https://"):
            raise ValueError("Set APP_ORIGIN to the exact production HTTPS origin")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        origins = [self.app_origin]
        if not self.production:
            # Vite prints its numeric loopback URL, while setup instructions use
            # localhost. Permit both aliases for the configured development port.
            parsed = urlsplit(self.app_origin)
            if parsed.hostname in {"localhost", "127.0.0.1", "::1"}:
                port = f":{parsed.port}" if parsed.port is not None else ""
                origins.extend(
                    f"{parsed.scheme}://{host}{port}" for host in ("localhost", "127.0.0.1")
                )
        return list(
            dict.fromkeys(
                origins + [v.strip().rstrip("/") for v in self.cors_origins.split(",") if v.strip()]
            )
        )

    @property
    def production(self) -> bool:
        return self.app_env == "production"

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key.get_secret_value())


@lru_cache
def get_settings() -> Settings:
    return Settings()
