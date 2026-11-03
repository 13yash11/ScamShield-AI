"""Expose the backend through Vercel's repository-root api convention."""

from backend.api.index import app

__all__ = ["app"]
