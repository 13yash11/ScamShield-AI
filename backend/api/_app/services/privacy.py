import hashlib
import re
from urllib.parse import urlsplit, urlunsplit


def redact(value: str) -> str:
    """Best-effort minimization, not a promise to identify every possible secret."""
    value = re.sub(
        r"(?i)(password|passwd|pin|otp|one.time.password|cvv|api.key)\s*(?::|=|\bis\b)\s*[^\s,;]+",
        r"\1: [redacted]",
        value,
    )
    value = re.sub(r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b", "[email redacted]", value)
    value = re.sub(r"(?<!\w)\+?\d[\d ()-]{4,}\d(?!\w)", "[number redacted]", value)

    def clean_url(match):
        try:
            url = urlsplit(match.group())
            host = url.hostname or ""
            if ":" in host:
                host = f"[{host}]"
            if url.port:
                host += f":{url.port}"
            return urlunsplit((url.scheme, host, url.path, "", ""))
        except ValueError:
            return "[URL redacted]"

    return re.sub(r"https?://[^\s<>\"]+", clean_url, value)


def content_reference(content: str, scan_type: str, store_content: bool) -> str:
    if scan_type == "screenshot":
        return "Screenshot (image and extracted text not retained)"
    if store_content:
        return redact(content)[:2000]
    return f"{scan_type.title()} submission (SHA-256: {hashlib.sha256(content.encode()).hexdigest()[:24]})"
