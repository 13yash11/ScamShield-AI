from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


def validate_password(value: SecretStr) -> SecretStr:
    if not 12 <= len(value.get_secret_value()) <= 128:
        raise ValueError("Password must contain 12–128 characters")
    return value


def validate_name(value: str) -> str:
    if len(value.strip()) < 2:
        raise ValueError("Full name must contain at least two characters")
    return value.strip()


class SignUpRequest(ApiModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr = Field(max_length=254)
    password: SecretStr
    re_password: SecretStr

    _name = field_validator("full_name")(validate_name)
    _password = field_validator("password")(validate_password)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.re_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(ApiModel):
    identifier: EmailStr = Field(max_length=254)
    password: SecretStr = Field(min_length=1, max_length=128)


class User(ApiModel):
    id: UUID
    full_name: str
    email: str
    role: Literal["user", "admin"]
    created_at: datetime


class ProfilePatch(ApiModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr

    _name = field_validator("full_name")(validate_name)


class PasswordChange(ApiModel):
    current_password: SecretStr = Field(min_length=1, max_length=128)
    new_password: SecretStr
    confirm_password: SecretStr

    _password = field_validator("new_password")(validate_password)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class ForgotPassword(ApiModel):
    email: EmailStr


class ResetPassword(ApiModel):
    access_token: SecretStr = Field(min_length=10, max_length=8192)
    new_password: SecretStr
    confirm_password: SecretStr

    _password = field_validator("new_password")(validate_password)

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
