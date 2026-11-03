"""Backend ASGI entrypoint; from the repo root use backend.api.index:app."""

from ._app.main import app

__all__ = ["app"]
