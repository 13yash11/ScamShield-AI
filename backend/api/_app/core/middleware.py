"""Small, bounded per-instance abuse guard; no passwords, URLs, or tokens logged."""

import time
from collections import OrderedDict

from starlette.responses import JSONResponse

from .config import Settings


class SecurityMiddleware:
    def __init__(self, app, settings: Settings):
        self.app = app
        self.settings = settings
        self.windows: OrderedDict[tuple, tuple[float, int]] = OrderedDict()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        headers = dict(scope["headers"])
        path = scope["path"]
        method = scope["method"]

        async def reject(status: int, detail: str, extra=None):
            await JSONResponse({"detail": detail}, status, headers=extra)(scope, receive, send)

        if method not in {"GET", "HEAD", "OPTIONS"}:
            # Cookie authentication requires an explicit trusted Origin. CLI clients
            # may omit Origin only when using a bearer token (or no cookies).
            origin = headers.get(b"origin", b"").decode("latin1")
            has_cookies = b"cookie" in headers
            bearer = headers.get(b"authorization", b"").lower().startswith(b"bearer ")
            if (origin and origin not in self.settings.allowed_origins) or (
                has_cookies and not origin and not bearer
            ):
                return await reject(403, "Request origin is not allowed.")

        if method == "POST" and path.startswith(("/api/v1/scan/", "/api/v1/auth/")):
            group = "scan" if "/scan/" in path else "auth"
            # Do not trust client-supplied X-Forwarded-For. Vercel's firewall
            # provides deployment-wide controls; this guard is per process.
            client = scope.get("client")
            key = (client[0] if client else "unknown", group)
            now = time.monotonic()
            start, count = self.windows.pop(key, (now, 0))
            if now - start >= 60:
                start, count = now, 0
            limit = (
                self.settings.scan_rate_limit if group == "scan" else self.settings.auth_rate_limit
            )
            self.windows[key] = (start, count + 1)
            while len(self.windows) > 4096:
                self.windows.popitem(last=False)
            if count >= limit:
                return await reject(
                    429, "Too many requests. Please try again shortly.", {"Retry-After": "60"}
                )

        # Enforce size before multipart parsing, including bodies without Content-Length.
        limit = (
            self.settings.max_upload_bytes + 64 * 1024 if path == "/api/v1/scan/file" else 64 * 1024
        )
        if method in {"POST", "PUT", "PATCH"}:
            parts, size = [], 0
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                size += len(message.get("body", b""))
                if size > limit:
                    return await reject(
                        413, "Request is too large. Screenshots must be at most 3 MB."
                    )
                parts.append(message.get("body", b""))
                if not message.get("more_body", False):
                    break
            body = b"".join(parts)
            delivered = False

            async def buffered_receive():
                nonlocal delivered
                if delivered:
                    return await receive()
                delivered = True
                return {"type": "http.request", "body": body, "more_body": False}

            next_receive = buffered_receive
        else:
            next_receive = receive

        async def secure_send(message):
            if message["type"] == "http.response.start":
                message["headers"] = list(message["headers"]) + [
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"referrer-policy", b"no-referrer"),
                    (b"cache-control", b"no-store"),
                ]
            await send(message)

        await self.app(scope, next_receive, secure_send)
