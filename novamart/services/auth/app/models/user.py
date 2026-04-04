from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, JSON
from sqlalchemy.sql import func
from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(50), unique=True, nullable=False)
    permissions = Column(JSON, nullable=False, default={})


class Store(Base):
    __tablename__ = "stores"

    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String(100), nullable=False)
    city      = Column(String(100))
    region    = Column(String(100))
    is_active = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role_id         = Column(Integer, ForeignKey("roles.id"))
    store_id        = Column(Integer, ForeignKey("stores.id"), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(TIMESTAMP(timezone=True), server_default=func.now())
