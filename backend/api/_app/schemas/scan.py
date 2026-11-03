import re
from urllib.parse import urlsplit

from pydantic import Field, field_validator

from .auth import ApiModel


def normalize_url(value: str) -> str:
    value = value.strip()
    if re.search(r"[\s\x00-\x1f\x7f\\]", value):
        raise ValueError("URL contains whitespace, backslashes, or control characters")
    if "://" not in value:
        value = "https://" + value
    try:
        parsed = urlsplit(value)
        host = parsed.hostname
        _ = parsed.port
        if parsed.scheme not in {"http", "https"} or not host:
            raise ValueError()
        ascii_host = host.encode("idna").decode("ascii")
        if len(ascii_host) > 253 or any(not label for label in ascii_host.rstrip(".").split(".")):
            raise ValueError()
        if ":" not in ascii_host and not re.fullmatch(r"[a-zA-Z0-9.-]+", ascii_host):
            raise ValueError()
    except (ValueError, UnicodeError):
        raise ValueError("Enter a valid HTTP or HTTPS URL") from None
    return value


class TextScanRequest(ApiModel):
    text: str = Field(min_length=10, max_length=8000)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value):
        value = value.strip()
        if len(value) < 10:
            raise ValueError("Provide at least 10 characters of message content")
        return value


class UrlScanRequest(ApiModel):
    url: str = Field(min_length=3, max_length=2048)

    _url = field_validator("url")(normalize_url)
