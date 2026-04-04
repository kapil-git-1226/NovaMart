from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Create sync engine — talks to PostgreSQL running in Docker
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    echo=(settings.ENVIRONMENT == "development")  # prints SQL queries in dev mode
)

# Session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# Base class for all our database models
class Base(DeclarativeBase):
    pass

# Dependency — used in every route to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
