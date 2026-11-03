"""Supabase Auth/PostgREST HTTP APIs. Never uses a service-role key or shared session."""

from collections.abc import AsyncIterator

import httpx
from fastapi import Depends, HTTPException

from ..core.config import Settings, get_settings


class SupabaseError(Exception):
    def __init__(self, status: int, code: str = ""):
        self.status = status
        self.code = code
        super().__init__("Supabase request failed")


class SupabaseService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client

    async def request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        json=None,
        params=None,
        prefer: str | None = None,
    ):
        if not self.settings.supabase_configured:
            raise HTTPException(
                503, "Supabase is not configured. See README.md#supabase-setup."
            )
        headers = {
            "apikey": self.settings.supabase_publishable_key.get_secret_value(),
            "Accept": "application/json",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if prefer:
            headers["Prefer"] = prefer
        try:
            response = await self.client.request(
                method, self.settings.supabase_url + path, headers=headers, json=json, params=params
            )
        except httpx.HTTPError:
            raise HTTPException(
                503, "Database/authentication service is temporarily unavailable."
            ) from None
        if not response.is_success:
            try:
                payload = response.json()
                code = payload.get("error_code") or payload.get("code") or ""
            except (ValueError, AttributeError):
                code = ""
            raise SupabaseError(response.status_code, str(code))
        if not response.content:
            return None
        try:
            return response.json()
        except ValueError:
            raise HTTPException(
                503, "Database/authentication service returned an invalid response."
            ) from None

    async def auth(
        self, method: str, path: str, *, token: str | None = None, json=None, params=None
    ):
        return await self.request(method, "/auth/v1/" + path, token=token, json=json, params=params)

    async def table(
        self, method: str, table: str, token: str, *, params=None, json=None, prefer=None
    ):
        try:
            return await self.request(
                method, "/rest/v1/" + table, token=token, params=params, json=json, prefer=prefer
            )
        except SupabaseError as exc:
            if exc.status in {401, 403}:
                raise HTTPException(
                    403, "You do not have permission to access this record."
                ) from None
            if exc.code in {"PGRST202", "PGRST205", "42P01", "42883"}:
                raise HTTPException(
                    503,
                    "Database setup is incomplete. The project owner needs to apply the Supabase migration before sign-in and saved records can work.",
                ) from None
            raise HTTPException(
                503,
                "Database operation failed. Please try again later.",
            ) from None

    async def rpc(self, function: str, token: str, params=None):
        return await self.table("POST", "rpc/" + function, token, json=params or {})


async def get_supabase(
    settings: Settings = Depends(get_settings),
) -> AsyncIterator[SupabaseService]:
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(8, connect=4), follow_redirects=False
    ) as client:
        yield SupabaseService(settings, client)
