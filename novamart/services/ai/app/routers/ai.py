from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.services.llm import generate_sql, validate_query_safety
from app.models.ai import AIQueryLog

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    store_id: Optional[int] = None

@router.post("/query")
def execute_ai_query(body: QueryRequest, db: Session = Depends(get_db)):
    # 1. Translate NL to SQL using Gemini
    sql = generate_sql(body.query, body.store_id)

    if sql == "REJECTED":
        raise HTTPException(status_code=400, detail="Invalid query. Please ask about store inventory, sales, or products.")

    # 2. Safety Check
    if not validate_query_safety(sql):
        raise HTTPException(status_code=403, detail="Generated SQL was flagged as unsafe.")

    # 3. Execute SELECT Query
    try:
        result = db.execute(text(sql)).mappings().fetchall()

        # 4. Log the query
        log = AIQueryLog(
            raw_query=body.query,
            generated_sql=sql,
            result_preview={"count": len(result)}
        )
        db.add(log)
        db.commit()

        return {
            "sql": sql,
            "results": [dict(r) for r in result],
            "row_count": len(result)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database execution error: {str(e)}")
