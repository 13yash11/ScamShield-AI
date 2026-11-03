"""Passive parsing only. No DNS, HTTP fetch, redirects, or reputation lookup."""

import ipaddress
from dataclasses import dataclass, field
from difflib import SequenceMatcher
from urllib.parse import unquote, urlsplit

from ..schemas.scan import normalize_url

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "is.gd", "rb.gy", "shorturl.at"}
BRANDS = {
    "google": ("google.com", "google.co.in"),
    "paypal": ("paypal.com",),
    "amazon": ("amazon.in", "amazon.com"),
    "sbi": ("sbi.co.in", "onlinesbi.sbi", "bank.sbi"),
    "hdfc": ("hdfcbank.com",),
    "icici": ("icicibank.com",),
    "microsoft": ("microsoft.com", "live.com", "office.com"),
    "apple": ("apple.com", "icloud.com"),
    "whatsapp": ("whatsapp.com",),
}


@dataclass
class URLAssessment:
    score: int = 0
    indicators: list[str] = field(default_factory=list)

    def add(self, weight: int, description: str):
        self.score += weight
        self.indicators.append(f"{description} (+{weight} heuristic points)")


def analyze_url(value: str) -> URLAssessment:
    parsed = urlsplit(normalize_url(value))
    host = (parsed.hostname or "").lower().rstrip(".")
    ascii_host = host.encode("idna").decode("ascii")
    labels = ascii_host.split(".")
    result = URLAssessment()
    if parsed.scheme != "https":
        result.add(5, "URL uses unencrypted HTTP")
    if parsed.username is not None:
        result.add(25, "User information before @ can disguise the actual destination")
    try:
        ip = ipaddress.ip_address(host)
        result.add(25, "Destination uses an IP address instead of a recognizable domain")
        if not ip.is_global:
            result.add(
                15, "Address points to a private, local, or reserved network; it was not visited"
            )
    except ValueError:
        if host == "localhost" or host.endswith((".local", ".internal")) or host.isdigit():
            result.add(20, "Destination appears to be local or an unusual numeric hostname")
    if ascii_host in SHORTENERS:
        result.add(20, "URL shortener hides the final destination")
    if "xn--" in ascii_host or not host.isascii():
        result.add(18, "Internationalized domain can contain visually confusing characters")
    if len(labels) > 4:
        result.add(12, "Many subdomains can obscure the registered destination")
    if host.count("-") >= 3 or len(host) > 70:
        result.add(10, "Unusually long or heavily hyphenated domain")
    for brand, domains in BRANDS.items():
        if any(ascii_host == domain or ascii_host.endswith("." + domain) for domain in domains):
            continue
        tokens = ascii_host.replace("-", ".").split(".")
        lookalike = any(
            len(token) >= 4
            and SequenceMatcher(None, brand, token.translate(str.maketrans("01", "ol"))).ratio()
            >= 0.8
            for token in tokens
        )
        if brand in ascii_host or lookalike:
            result.add(
                25,
                f"Domain resembles {brand} but does not match the configured official-domain examples",
            )
            break
    decoded = unquote(parsed.path + "?" + parsed.query).lower()
    if any(
        word in decoded
        for word in (
            "verify-account",
            "secure-login",
            "update-kyc",
            "password-reset",
            "wallet-connect",
        )
    ):
        result.add(12, "Path or query uses account-verification or credential-request patterns")
    if any(decoded.split("?")[0].endswith(ext) for ext in (".exe", ".apk", ".scr", ".msi")):
        result.add(20, "URL appears to offer an executable download")
    result.score = min(90, result.score)
    return result
