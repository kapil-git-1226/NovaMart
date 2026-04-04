from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, Role
from app.schemas.auth import UserCreate, UserLogin, Token, RefreshRequest, UserOut
from app.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Helper: get the currently logged-in user from JWT ─────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    data = decode_token(token)
    if not data or data.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


# ── POST /auth/register ───────────────────────────────────
@router.post("/register", response_model=UserOut, status_code=201)
def register(body: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check if role_id is valid
    if not db.query(Role).filter(Role.id == body.role_id).first():
        raise HTTPException(status_code=400, detail="Invalid role_id")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role_id=body.role_id,
        store_id=body.store_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── POST /auth/login ──────────────────────────────────────
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else "unknown"

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": role_name,
        "store_id": user.store_id
    }
    return Token(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload)
    )


# ── POST /auth/refresh ────────────────────────────────────
@router.post("/refresh", response_model=Token)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    data = decode_token(body.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    role = db.query(Role).filter(Role.id == user.role_id).first()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": role.name if role else "unknown",
        "store_id": user.store_id
    }
    return Token(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload)
    )


# ── GET /auth/me ──────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── PATCH /auth/users/{id}/role ───────────────────────────
@router.patch("/users/{user_id}/role")
def change_role(
    user_id: int,
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not current_role or current_role.name != "regional_admin":
        raise HTTPException(status_code=403, detail="Only regional admins can change roles")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role_id = role_id
    db.commit()
    return {"message": f"User {user_id} role updated to role_id {role_id}"}
