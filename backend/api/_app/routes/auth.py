from fastapi import APIRouter, Depends, HTTPException, Request, Response

from ..core.config import Settings, get_settings
from ..core.security import (
    LOGIN_ERROR,
    REFRESH_COOKIE,
    AuthenticatedUser,
    clear_session,
    current_user,
    read_token,
    resolve_user,
    set_session,
)
from ..schemas.auth import (
    ForgotPassword,
    LoginRequest,
    PasswordChange,
    ResetPassword,
    SignUpRequest,
)
from ..services.supabase_service import SupabaseError, SupabaseService, get_supabase

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", status_code=201)
async def signup(
    body: SignUpRequest,
    db: SupabaseService = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    try:
        data = await db.auth(
            "POST",
            "signup",
            json={
                "email": str(body.email).lower(),
                "password": body.password.get_secret_value(),
                "data": {"full_name": body.full_name},
            },
            params={"redirect_to": settings.app_origin + "/login"},
        )
    except SupabaseError as exc:
        if exc.code in {"user_already_exists", "email_exists"}:
            raise HTTPException(409, "This email is already registered. Please sign in.") from None
        if exc.status == 429:
            raise HTTPException(
                429, "Registration email limit reached. Please try again later."
            ) from None
        if exc.status >= 500:
            raise HTTPException(
                503,
                "Registration could not finish. Check Supabase email and database configuration.",
            ) from None
        raise HTTPException(
            400, "Registration was rejected. Check your details and password policy."
        ) from None
    identity = data.get("user") or data
    if identity.get("identities") == []:
        raise HTTPException(409, "This email is already registered. Please sign in.")
    # Do not authenticate a signup response; require an explicit email/password login.
    return {
        "success": True,
        "requiresConfirmation": not bool(identity.get("email_confirmed_at")),
        "message": "Check your email to confirm your account, then sign in."
        if not identity.get("email_confirmed_at")
        else "Account created. You can sign in now.",
    }


@router.post("/login")
async def login(
    body: LoginRequest,
    response: Response,
    db: SupabaseService = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    try:
        session = await db.auth(
            "POST",
            "token",
            params={"grant_type": "password"},
            json={
                "email": body.identifier.strip().lower(),
                "password": body.password.get_secret_value(),
            },
        )
    except SupabaseError as exc:
        if exc.status >= 500:
            raise HTTPException(503, "Authentication service is temporarily unavailable.") from None
        if exc.status == 429:
            raise HTTPException(429, "Too many sign-in attempts. Please try again later.") from None
        raise HTTPException(401, LOGIN_ERROR) from None
    auth = await resolve_user(session["access_token"], db)
    set_session(response, session, settings)
    return {"success": True, "user": auth.user.model_dump(mode="json", by_alias=True)}


@router.get("/me")
async def me(auth: AuthenticatedUser = Depends(current_user)):
    return {"user": auth.user}


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: SupabaseService = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        raise HTTPException(401, "Please sign in again.")
    try:
        session = await db.auth(
            "POST",
            "token",
            params={"grant_type": "refresh_token"},
            json={"refresh_token": refresh_token},
        )
    except SupabaseError as exc:
        if exc.status >= 500 or exc.status == 429:
            raise HTTPException(503, "Authentication service is temporarily unavailable.") from None
        raise HTTPException(401, "Your session has ended. Please sign in again.") from None
    await resolve_user(session["access_token"], db)
    set_session(response, session, settings)
    return {"success": True}


@router.post("/logout")
async def logout(
    request: Request,
    db: SupabaseService = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    # Always remove browser cookies, while accurately reporting remote failures.
    token = read_token(request)
    response = Response(status_code=204)
    try:
        if not token and request.cookies.get(REFRESH_COOKIE):
            session = await db.auth(
                "POST",
                "token",
                params={"grant_type": "refresh_token"},
                json={"refresh_token": request.cookies[REFRESH_COOKIE]},
            )
            token = session["access_token"]
        if token:
            await db.auth("POST", "logout", token=token, params={"scope": "local"})
    except SupabaseError as exc:
        if exc.status not in {401, 403, 404}:
            response = Response(
                status_code=503,
                content='{"detail":"Local session cleared; remote sign-out could not be confirmed."}',
                media_type="application/json",
            )
    except HTTPException:
        response = Response(
            status_code=503,
            content='{"detail":"Local session cleared; remote sign-out could not be confirmed."}',
            media_type="application/json",
        )
    clear_session(response, settings)
    return response


@router.post("/password")
async def password(
    body: PasswordChange,
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    try:
        # Reauthenticate before changing a password and dispose of the temporary session.
        verified = await db.auth(
            "POST",
            "token",
            params={"grant_type": "password"},
            json={"email": auth.user.email, "password": body.current_password.get_secret_value()},
        )
        try:
            await db.auth(
                "PUT",
                "user",
                token=auth.token,
                json={"password": body.new_password.get_secret_value()},
            )
        finally:
            try:
                await db.auth(
                    "POST", "logout", token=verified["access_token"], params={"scope": "local"}
                )
            except (SupabaseError, HTTPException):
                # Password updates may already revoke this temporary session.
                # Cleanup failure must not turn a successful password change into
                # an incorrect "password rejected" message.
                pass
    except SupabaseError as exc:
        if exc.status >= 500:
            raise HTTPException(503, "Password service is temporarily unavailable.") from None
        raise HTTPException(
            400,
            "Password change rejected. Check your current password and Supabase password policy.",
        ) from None
    return {"success": True, "message": "Password updated."}


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPassword,
    db: SupabaseService = Depends(get_supabase),
    settings: Settings = Depends(get_settings),
):
    try:
        await db.auth(
            "POST",
            "recover",
            json={"email": str(body.email).lower()},
            params={"redirect_to": settings.app_origin + "/reset-password"},
        )
    except SupabaseError as exc:
        if exc.status >= 500:
            raise HTTPException(503, "Email service is temporarily unavailable.") from None
        # Same public response for unknown emails and provider rate limits.
    return {
        "success": True,
        "message": "If that account exists, a password reset email will arrive. Check your inbox and spam folder.",
    }


@router.post("/reset-password")
async def reset_password(body: ResetPassword, db: SupabaseService = Depends(get_supabase)):
    token = body.access_token.get_secret_value()
    await resolve_user(token, db)
    try:
        await db.auth(
            "PUT", "user", token=token, json={"password": body.new_password.get_secret_value()}
        )
        await db.auth("POST", "logout", token=token, params={"scope": "local"})
    except SupabaseError:
        raise HTTPException(
            400, "Reset link is invalid, expired, or the password was rejected. Request a new link."
        ) from None
    return {"success": True, "message": "Password updated. Sign in with your new password."}
