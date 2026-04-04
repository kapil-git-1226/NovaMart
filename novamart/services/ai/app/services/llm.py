import re
from google import genai
from app.config import settings

# Initialize the new google.genai client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

SCHEMA_CONTEXT = """
You are a SQL expert for NovaMart, an omnichannel retail platform.
Translate natural language questions into valid PostgreSQL SELECT statements.

Database Schema:
- stores (id, name, city, region, is_active)
- users (id, name, email, role_id, store_id)
- products (id, sku, name, category, unit, price, cost_price, reorder_level)
- inventory (id, store_id, product_id, quantity, last_updated)
- stock_movements (id, store_id, product_id, type[IN/OUT/ADJ], qty, reference_id, moved_at)
- transactions (id, store_id, cashier_id, total_amount, payment_method, status, created_at)
- transaction_items (id, transaction_id, product_id, qty, unit_price, discount)

Rules:
1. ONLY return the SQL statement. No markdown, no explanations, no code fences.
2. Use valid PostgreSQL syntax.
3. If the question implies a specific store and you are given a context store_id, ALWAYS filter by WHERE store_id = <store_id>.
4. If a question is ambiguous, choose the most logical report.
5. NEVER generate DROP, DELETE, INSERT, or UPDATE statements. Only SELECT.
6. If the request is not related to the database, respond with exactly: REJECTED
7. Always alias joined tables for clarity (e.g., p for products, i for inventory).
"""

def generate_sql(prompt: str, store_id: int = None) -> str:
    full_prompt = f"{SCHEMA_CONTEXT}\nContext Store ID: {store_id}\nUser Question: {prompt}\nSQL:"

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt,
    )
    sql = response.text.strip() 

    # Clean output — strip markdown code fences if LLM hallucinated them
    sql = re.sub(r'```sql\n?', '', sql)
    sql = re.sub(r'```\n?', '', sql)
    sql = sql.strip()

    # Safety check: only SELECT allowed
    if sql.upper() == "REJECTED" or not sql.upper().startswith("SELECT"):
        return "REJECTED"

    return sql


def validate_query_safety(sql: str) -> bool:
    """Regex blocklist check before DB execution."""
    forbidden = [
        r"\bDROP\b", r"\bDELETE\b", r"\bTRUNCATE\b",
        r"\bUPDATE\b", r"\bINSERT\b", r"\bGRANT\b",
        r"\bEXEC\b", r"\bhashed_password\b",
    ]
    for pattern in forbidden:
        if re.search(pattern, sql, re.IGNORECASE):
            return False
    return True
