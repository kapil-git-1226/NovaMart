from sqlalchemy import Column, Integer, String, Text, Boolean, TIMESTAMP, JSON
from sqlalchemy.sql import func
from app.database import Base

class AIQueryLog(Base):
    __tablename__ = "ai_query_log"

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, nullable=True)   # FK exists in DB, no ORM ref needed
    raw_query      = Column(Text, nullable=False)
    generated_sql  = Column(Text)
    result_preview = Column(JSON)
    executed_at    = Column(TIMESTAMP(timezone=True), server_default=func.now())
    flagged        = Column(Boolean, default=False)

class AnomalyFlag(Base):
    __tablename__ = "anomaly_flags"

    id          = Column(Integer, primary_key=True)
    entity_type = Column(String(50))
    entity_id   = Column(Integer)
    reason      = Column(Text)
    severity    = Column(String(20))
    created_at  = Column(TIMESTAMP(timezone=True), server_default=func.now())
    resolved    = Column(Boolean, default=False)
