from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, Response

from ..schemas.auth import User
from ..services.supabase_service import SupabaseError, SupabaseService, get_supabase
from .config import Settings

ACCESS_COOKIE = "scamshield_access"
REFRESH_COOKIE = "scamshield_refresh"
LOGIN_ERROR = "Invalid email or password."


@dataclass
class AuthenticatedUser:
    user: User
    token: str


def set_session(response: Response, session: dict, settings: Settings):
    response.set_cookie(
        ACCESS_COOKIE,
        session["access_token"],
        max_age=int(session.get("expires_in", 3600)),
        httponly=True,
        secure=settings.production,
        samesite="lax",
        path="/api",
    )
    response.set_cookie(
        REFRESH_COOKIE,
        session["refresh_token"],
        max_age=30 * 24 * 3600,
        httponly=True,
        secure=settings.production,
        samesite="lax",
        path="/api/v1/auth",
    )


def clear_session(response: Response, settings: Settings):
    for name, path in [(ACCESS_COOKIE, "/api"), (REFRESH_COOKIE, "/api/v1/auth")]:
        response.delete_cookie(
            name, path=path, secure=settings.production, httponly=True, samesite="lax"
        )


def read_token(request: Request) -> str | None:
    authorization = request.headers.get("Authorization")
    if authorization is not None:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            raise HTTPException(401, "A valid authenticated session is required.")
        return token.strip()
    return request.cookies.get(ACCESS_COOKIE)


async def resolve_user(token: str, db: SupabaseService) -> AuthenticatedUser:
    try:
        identity = await db.auth("GET", "user", token=token)
    except SupabaseError as exc:
        if exc.status >= 500 or exc.status == 429:
            raise HTTPException(503, "Authentication service is temporarily unavailable.") from None
        raise HTTPException(401, "Your session has expired. Please sign in again.") from None
    if not identity.get("id") or not identity.get("email_confirmed_at"):
        raise HTTPException(401, "Confirm your email address before signing in.")
    # Supabase JWTs can outlive a sign-out. Check the session record too.
    if not await db.rpc("session_is_active", token):
        raise HTTPException(401, "Your session has ended. Please sign in again.")
    profiles = await db.table(
        "GET",
        "profiles",
        token,
        params={
            "id": f"eq.{identity['id']}",
            "select": "id,full_name,email,role,created_at",
            "limit": "1",
        },
    )
    if not profiles:
        raise HTTPException(503, "User profile is missing. Check the database migration.")
    profile = dict(profiles[0])
    return AuthenticatedUser(User.model_validate(profile), token)


async def current_user(
    request: Request, db: SupabaseService = Depends(get_supabase)
) -> AuthenticatedUser:
    token = read_token(request)
    if not token:
        raise HTTPException(401, "Please sign in to continue.")
    return await resolve_user(token, db)


async def admin_user(auth: AuthenticatedUser = Depends(current_user)) -> AuthenticatedUser:
    if auth.user.role != "admin":
        raise HTTPException(403, "Administrator access is required.")
    return auth
