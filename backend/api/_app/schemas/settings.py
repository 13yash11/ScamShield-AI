from pydantic import Field

from .auth import ApiModel, ProfilePatch, User


class NotificationPreferences(ApiModel):
    security_notices: bool = True


class PrivacyPreferences(ApiModel):
    save_history: bool = True
    store_content: bool = False
    use_ai: bool = True


class SettingsPatch(ApiModel):
    profile: ProfilePatch | None = None
    notification_preferences: NotificationPreferences | None = None
    privacy_preferences: PrivacyPreferences | None = None


class UserSettings(ApiModel):
    user: User
    notification_preferences: NotificationPreferences = Field(
        default_factory=NotificationPreferences
    )
    privacy_preferences: PrivacyPreferences = Field(default_factory=PrivacyPreferences)
    message: str | None = None
