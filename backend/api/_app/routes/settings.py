from fastapi import APIRouter, Depends, HTTPException

from ..core.security import AuthenticatedUser, current_user
from ..schemas.settings import SettingsPatch, UserSettings
from ..services.supabase_service import SupabaseError, SupabaseService, get_supabase

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])


async def load_settings(db: SupabaseService, auth: AuthenticatedUser) -> UserSettings:
    records = await db.table(
        "GET",
        "user_settings",
        auth.token,
        params={
            "user_id": f"eq.{auth.user.id}",
            "select": "notification_preferences,privacy_preferences",
            "limit": "1",
        },
    )
    if not records:
        raise HTTPException(503, "User settings are missing. Check the database migration.")
    return UserSettings(user=auth.user, **records[0])


@router.get("", response_model=UserSettings)
async def get_settings(
    auth: AuthenticatedUser = Depends(current_user), db: SupabaseService = Depends(get_supabase)
):
    return await load_settings(db, auth)


@router.patch("", response_model=UserSettings)
async def update_settings(
    body: SettingsPatch,
    auth: AuthenticatedUser = Depends(current_user),
    db: SupabaseService = Depends(get_supabase),
):
    preferences = body.model_dump(exclude_none=True, exclude_unset=True, exclude={"profile"})
    if preferences:
        existing = (await load_settings(db, auth)).model_dump()
        preferences = {key: {**existing[key], **value} for key, value in preferences.items()}
        await db.table(
            "PATCH",
            "user_settings",
            auth.token,
            params={"user_id": f"eq.{auth.user.id}"},
            json=preferences,
        )
    message = "Settings saved."
    if body.profile:
        profile = body.profile
        data = {"data": {"full_name": profile.full_name, "phone_number": profile.phone_number}}
        if str(profile.email).lower() != auth.user.email.lower():
            data["email"] = str(profile.email).lower()
            message = "Profile saved. Confirm the email change using the links sent by Supabase."
        try:
            await db.auth("PUT", "user", token=auth.token, json=data)
        except SupabaseError as exc:
            if exc.status >= 500:
                raise HTTPException(
                    503,
                    "Profile update could not finish. Check Supabase configuration and verified phone uniqueness.",
                ) from None
            raise HTTPException(
                400,
                "Profile update rejected. The email or verified phone may already be registered.",
            ) from None
        profiles = await db.table(
            "GET",
            "profiles",
            auth.token,
            params={
                "id": f"eq.{auth.user.id}",
                "select": "id,full_name,email,phone_number,role,created_at",
                "limit": "1",
            },
        )
        if not profiles:
            raise HTTPException(503, "Profile could not be loaded after the update.")
        auth.user = auth.user.model_validate(
            {**profiles[0], "phone_number": profiles[0].get("phone_number") or ""}
        )
    settings = await load_settings(db, auth)
    settings.message = message
    return settings
