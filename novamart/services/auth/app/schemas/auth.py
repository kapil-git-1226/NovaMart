from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Used when creating a new user ─────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int
    store_id: Optional[int] = None


# ── Used when logging in ───────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Returned after a successful login ─────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ── Used when refreshing a token ──────────────────────────
class RefreshRequest(BaseModel):
    refresh_token: str


# ── Returned when viewing user info ───────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role_id: int
    store_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy objects


# ── OTP: request a code to be sent to email ───────────────
class OtpRequest(BaseModel):
    email: EmailStr


# ── OTP: verify the code that was sent ────────────────────
class OtpVerify(BaseModel):
    email: EmailStr
    code: str
