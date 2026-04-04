# Master.md — NovaMart Omnichannel Retail Operations Platform
> **Hackathon Blueprint** | 40-Hour Sprint | Version 1.0

---

## 1. SYSTEM OVERVIEW

### Project Summary
- **Client:** NovaMart Retail Group — 86 stores (India + Southeast Asia)
- **Type:** Omnichannel Convenience Retail Operations Platform
- **Stack:** FastAPI · PostgreSQL · React (Vite) · Docker

### Key Features
- **Inventory Management:** Real-time stock tracking, replenishment alerts, multi-store view
- **Sales & Billing:** POS-style billing, receipt generation, daily sales summary
- **Dashboards & BI:** Store-wise KPIs, trend charts, top products
- **Agentic AI:** Product recommendations, anomaly detection, conversational SQL queries

### User Roles (RBAC)
| Role | Permissions |
|---|---|
| `regional_admin` | All stores — full read/write, reports, user management |
| `store_manager` | Own store — full ops, view analytics |
| `inventory_supervisor` | Own store — inventory CRUD, replenishment |
| `sales_associate` | Own store — create sales, view own transactions |

---

## 2. ARCHITECTURE

### ASCII Diagram
```
┌─────────────────────────────────────────────────────────┐
│                        CLIENTS                          │
│          React SPA / PWA (Mobile + Desktop)             │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│                    API GATEWAY                          │
│         (Nginx — Route + JWT validation)                │
└──┬──────────┬─────────┬──────────┬──────────┬───────────┘
   │          │         │          │          │
┌──▼──┐  ┌───▼───┐  ┌──▼───┐  ┌───▼──┐  ┌───▼───┐
│Auth │  │  Inv  │  │Sales │  │Analy-│  │  AI   │
│Svc  │  │  Svc  │  │ Svc  │  │tics  │  │  Svc  │
│8001 │  │ 8002  │  │ 8003 │  │ 8004 │  │ 8005  │
└──┬──┘  └───┬───┘  └──┬───┘  └───┬──┘  └───┬───┘
   └──────────┴─────────┴──────────┴──────────┘
                        │
          ┌─────────────▼──────────────┐
          │       PostgreSQL DB        │
          │   (shared, single schema)  │
          └────────────────────────────┘
                        │
               ┌────────▼────────┐
               │  Redis Cache    │
               │ (KPIs, reco)    │
               └─────────────────┘
```

### Communication
- **Sync:** REST / JSON via API Gateway for all client ↔ service calls
- **Auth:** JWT validated at gateway; role + store_id embedded in token
- **Async (future):** Kafka or RabbitMQ for event streaming (post-hackathon)

---

## 3. MICROSERVICES DESIGN

### 3.1 Auth Service (port 8001)
**Purpose:** Registration, login, JWT issuance, RBAC, token refresh

**Key Endpoints:**
```
POST   /auth/register              Admin creates user
POST   /auth/login                 Returns access + refresh token
POST   /auth/refresh               Rotate refresh token
POST   /auth/logout                Blocklist JTI
GET    /auth/me                    Current user profile
PATCH  /auth/users/{id}/role       Change role (admin only)
```

**DB Tables:**
```sql
users (id, name, email, hashed_password, role_id, store_id, is_active, created_at)
roles (id, name, permissions JSONB)
token_blocklist (jti, expires_at)
```

---

### 3.2 Inventory Service (port 8002)
**Purpose:** Product catalog, per-store stock, replenishment alerts

**Key Endpoints:**
```
GET    /inventory/{store_id}                All stock for a store
GET    /inventory/{store_id}/{product_id}   Single SKU stock
POST   /inventory/products                  Add product
PUT    /inventory/stock/adjust              Adjust stock (receive/transfer)
GET    /inventory/alerts/{store_id}         Low-stock replenishment alerts
POST   /inventory/products/bulk             Bulk import via CSV
```

**DB Tables:**
```sql
products      (id, sku, name, category, unit, price, cost_price, reorder_level, image_url)
inventory     (id, store_id, product_id, quantity, last_updated)
stock_movements (id, store_id, product_id, type[IN/OUT/ADJ], qty, reference_id, moved_at)
```

---

### 3.3 Sales / Billing Service (port 8003)
**Purpose:** POS transactions, receipts, returns

**Key Endpoints:**
```
POST   /sales/                       Create sale (cart → transaction)
GET    /sales/{store_id}             List sales (date filtered)
GET    /sales/transaction/{id}       Single transaction detail
GET    /sales/summary/{store_id}     Daily/weekly sales rollup
POST   /sales/return/{txn_id}        Process return/refund
```

**DB Tables:**
```sql
transactions      (id, store_id, cashier_id, total_amount, payment_method, status, created_at)
transaction_items (id, transaction_id, product_id, qty, unit_price, discount)
returns           (id, transaction_id, reason, refund_amount, processed_at)
```

---

### 3.4 Analytics Service (port 8004)
**Purpose:** Aggregated BI — KPIs, trends, store comparisons

**Key Endpoints:**
```
GET   /analytics/kpis/{store_id}          Revenue, units sold, avg basket
GET   /analytics/top-products/{store_id}  Best sellers (period filter)
GET   /analytics/store-comparison         Cross-store revenue (admin only)
GET   /analytics/inventory-health         Turnover ratio, dead stock
GET   /analytics/hourly-sales/{store_id}  Heatmap data
```

**Notes:**
- Reads from `transactions`, `transaction_items`, `inventory`, `products`
- Uses `daily_sales_mv` materialized view for fast dashboard loads

---

### 3.5 AI Service (port 8005)
**Purpose:** Recommendations, anomaly detection, conversational SQL

**Key Endpoints:**
```
POST   /ai/recommend         Product recommendations for current cart
POST   /ai/anomaly/check     Flag suspicious transaction or stock event
POST   /ai/query             Natural language → SQL → result
GET    /ai/query/history     Past NL queries by user
```

**DB Tables:**
```sql
ai_query_log  (id, user_id, raw_query, generated_sql, result_preview, executed_at, flagged)
anomaly_flags (id, entity_type, entity_id, reason, severity, created_at, resolved)
```

---

## 4. DATABASE DESIGN (PostgreSQL)

### ERD (Simplified)
```
stores ──< inventory >── products
  │                         │
  └──< transactions >── transaction_items
         │
      users (cashier_id)  ──  roles
```

### Full Schema
```sql
-- stores
CREATE TABLE stores (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  city      VARCHAR(100),
  region    VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
);

-- roles
CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'
);

-- users
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role_id         INT REFERENCES roles(id),
  store_id        INT REFERENCES stores(id),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- products
CREATE TABLE products (
  id            SERIAL PRIMARY KEY,
  sku           VARCHAR(50) UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  category      VARCHAR(100),
  unit          VARCHAR(20) DEFAULT 'piece',
  price         NUMERIC(10,2) NOT NULL,
  cost_price    NUMERIC(10,2),
  reorder_level INT DEFAULT 10
);

-- inventory
CREATE TABLE inventory (
  id           SERIAL PRIMARY KEY,
  store_id     INT REFERENCES stores(id),
  product_id   INT REFERENCES products(id),
  quantity     INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

-- stock_movements
CREATE TABLE stock_movements (
  id           SERIAL PRIMARY KEY,
  store_id     INT REFERENCES stores(id),
  product_id   INT REFERENCES products(id),
  type         VARCHAR(10) NOT NULL,   -- IN / OUT / ADJ
  qty          INT NOT NULL,
  reference_id INT,
  moved_at     TIMESTAMPTZ DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
  id             SERIAL PRIMARY KEY,
  store_id       INT REFERENCES stores(id),
  cashier_id     INT REFERENCES users(id),
  total_amount   NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(30),
  status         VARCHAR(20) DEFAULT 'completed',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- transaction_items
CREATE TABLE transaction_items (
  id             SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  product_id     INT REFERENCES products(id),
  qty            INT NOT NULL,
  unit_price     NUMERIC(10,2) NOT NULL,
  discount       NUMERIC(5,2) DEFAULT 0
);

-- returns
CREATE TABLE returns (
  id             SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  reason         TEXT,
  refund_amount  NUMERIC(10,2),
  processed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- audit_log
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ai_query_log
CREATE TABLE ai_query_log (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id),
  raw_query      TEXT NOT NULL,
  generated_sql  TEXT,
  result_preview JSONB,
  executed_at    TIMESTAMPTZ DEFAULT NOW(),
  flagged        BOOLEAN DEFAULT FALSE
);

-- anomaly_flags
CREATE TABLE anomaly_flags (
  id          SERIAL PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id   INT,
  reason      TEXT,
  severity    VARCHAR(20),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved    BOOLEAN DEFAULT FALSE
);
```

### Indexes
```sql
CREATE INDEX idx_inventory_store    ON inventory(store_id);
CREATE INDEX idx_inventory_product  ON inventory(product_id);
CREATE INDEX idx_transactions_store ON transactions(store_id, created_at DESC);
CREATE INDEX idx_tx_items_txn       ON transaction_items(transaction_id);
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_audit_user         ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_stock_mov_store    ON stock_movements(store_id, moved_at DESC);
```

### Materialized View (Analytics)
```sql
CREATE MATERIALIZED VIEW daily_sales_mv AS
SELECT
  store_id,
  DATE(created_at)      AS day,
  SUM(total_amount)     AS revenue,
  COUNT(*)              AS tx_count,
  AVG(total_amount)     AS avg_basket
FROM transactions
GROUP BY store_id, DATE(created_at);

REFRESH MATERIALIZED VIEW CONCURRENTLY daily_sales_mv;
```

---

## 5. API DESIGN

### Auth Flow (JWT)
```
CLIENT                          AUTH SERVICE
  │─── POST /auth/login ────────▶ │
  │    {email, password}          │  bcrypt verify → JWT sign
  │◀── 200 {access_token,         │
  │         refresh_token} ───────│
  │
  │─── GET /inventory/7 ──▶ NGINX ──▶ Decode JWT ──▶ Inventory Svc
```

**JWT Payload:**
```json
{
  "sub": "42",
  "email": "manager@novamart.com",
  "role": "store_manager",
  "store_id": 7,
  "exp": 1712345678
}
```

### Sample Requests

**POST /sales/** — Create Sale
```json
// Request
{
  "store_id": 7,
  "payment_method": "upi",
  "items": [
    {"product_id": 101, "qty": 2, "unit_price": 45.00},
    {"product_id": 204, "qty": 1, "unit_price": 120.00}
  ]
}
// Response 201
{
  "transaction_id": 8821,
  "total_amount": 210.00,
  "status": "completed",
  "receipt_url": "/sales/receipt/8821"
}
```

**GET /inventory/alerts/7** — Replenishment Alerts
```json
// Response 200
{
  "alerts": [
    {"product_id": 101, "sku": "BEV-001", "name": "Cola 250ml",
     "quantity": 3, "reorder_level": 20},
    {"product_id": 204, "sku": "SNK-014", "name": "Chips 40g",
     "quantity": 8, "reorder_level": 15}
  ]
}
```

**POST /ai/query** — Conversational Query
```json
// Request
{"query": "What were the top 5 products sold in store 7 last week?"}
// Response 200
{
  "sql": "SELECT p.name, SUM(ti.qty) AS total FROM ...",
  "results": [["Cola 250ml", 420], ["Chips 40g", 310]],
  "row_count": 5
}
```

---

## 6. AI FEATURES

### 6.1 Product Recommendations
- **Method:** Co-purchase matrix on `transaction_items`
- **Nightly job:** Precompute top N product pairs → store in Redis / DB table
  ```sql
  SELECT a.product_id p1, b.product_id p2, COUNT(*) freq
  FROM transaction_items a
  JOIN transaction_items b
    ON a.transaction_id = b.transaction_id AND a.product_id < b.product_id
  GROUP BY p1, p2 ORDER BY freq DESC LIMIT 500;
  ```
- **Fallback:** Top-selling products in same category (no history)
- **Response TTL:** Cache 1 hour in Redis

### 6.2 Anomaly Detection
- **Method:** Z-score on transaction amounts + IQR on stock deltas
- **Triggers:**
  - `transaction.amount > mean + 3σ` → HIGH flag
  - Stock drop rate > 2× expected daily sales → MEDIUM flag
  - Same cashier > 30 txns/hour → REVIEW flag
- **Code:**
  ```python
  import numpy as np

  def detect_amount_anomaly(tx_amount: float, store_amounts: list[float]) -> bool:
      mean = np.mean(store_amounts)
      std  = np.std(store_amounts)
      return abs(tx_amount - mean) > 3 * std
  ```
- **Storage:** `anomaly_flags` table; surfaced on manager dashboard

### 6.3 Conversational Query (Text-to-SQL)
- **Tools:** OpenAI `gpt-4o-mini` (or local Ollama/Mistral) + SQLAlchemy
- **Flow:**
  ```
  User NL Input
    → Safety check (blocked phrases)
    → Build prompt (schema context + store_id scoping)
    → LLM generates SQL
    → Validate SQL (whitelist + regex)
    → Execute on READ-ONLY DB connection
    → Mask PII columns
    → Return rows (max 500)
    → Log to ai_query_log
  ```
- **System Prompt:**
  ```
  You are a SQL assistant for NovaMart's retail database.
  Tables: stores, products, inventory, transactions, transaction_items
  Rules:
    - Output SELECT statements ONLY
    - Never access: users.hashed_password, audit_log
    - Always filter: WHERE store_id = {store_id} (unless regional_admin)
    - No subqueries that touch user credentials
  Question: {user_query}
  SQL:
  ```

---

## 7. SECURITY

### JWT Configuration
- **Library:** `python-jose[cryptography]` or `PyJWT`
- **Access token TTL:** 30 minutes
- **Refresh token TTL:** 7 days (rotate on each use)
- **Blocklist:** Store invalidated JTIs in Redis (key: `blocklist:{jti}`, TTL = token expiry)

### RBAC Dependency
```python
from fastapi import Depends, HTTPException

def require_role(*allowed_roles: str):
    def checker(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return checker

# Usage:
@router.get("/analytics/store-comparison")
async def compare_stores(user=Depends(require_role("regional_admin"))):
    ...
```

### Store Isolation
```python
# Base query helper — non-admin always scoped to their store
def scoped_query(stmt, user):
    if user.role != "regional_admin":
        stmt = stmt.where(Table.store_id == user.store_id)
    return stmt
```

### Audit Logging
```python
def log_action(db, user_id, action, entity_type=None, entity_id=None, metadata=None):
    db.add(AuditLog(
        user_id=user_id, action=action,
        entity_type=entity_type, entity_id=entity_id,
        metadata=metadata
    ))
    db.commit()
# Call after every CREATE / UPDATE / DELETE operation
```

### Additional Protections
| Concern | Solution |
|---|---|
| Password storage | `passlib[bcrypt]`, cost factor 12 |
| Input validation | Pydantic v2 models on all request bodies |
| SQL injection | SQLAlchemy ORM only; no raw f-string SQL |
| Rate limiting | `slowapi` — 100 req/min per IP |
| CORS | Whitelist frontend origin only |
| HTTPS | Nginx + Let's Encrypt (production) |
| Secrets | `.env` via `pydantic-settings`; never commit to Git |

---

## 8. SCALABILITY & PERFORMANCE

- **Stateless services** → horizontal scale with Docker replicas or Kubernetes pods
- **Async FastAPI** — `async def` + `asyncpg` driver for non-blocking DB
- **Connection pool:** `pool_size=10`, `max_overflow=20` in SQLAlchemy
- **Redis caching:**
  ```python
  import redis, json
  r = redis.Redis.from_url(settings.REDIS_URL)

  def get_kpis(store_id: int):
      cached = r.get(f"kpi:{store_id}")
      if cached:
          return json.loads(cached)
      data = compute_kpis(store_id)
      r.setex(f"kpi:{store_id}", 300, json.dumps(data))  # 5-min TTL
      return data
  ```
- **Materialized views** for analytics (refresh on cron or after large txn batches)
- **Pagination** on all list endpoints: `?limit=50&offset=0`
- **DB read replica** (future): Route `/analytics/*` queries to replica

---

## 9. RELIABILITY

### Retry Logic
```python
import tenacity

@tenacity.retry(
    wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
    stop=tenacity.stop_after_attempt(3),
    reraise=True
)
async def call_external(url: str):
    ...
```

### Offline-First PWA Strategy
- **Service Worker:** Cache product catalog + last inventory snapshot
- **IndexedDB:** Queue pending sales transactions locally
- **Background Sync API:** Auto-POST queued sales when connection restored
- **Conflict resolution:** Server `created_at` timestamp wins on sync
- **Stale UI banner:** Show "Last synced: 5 min ago" when offline

### Graceful Degradation
| Failure | Response |
|---|---|
| AI Service down | Return `[]` recommendations silently |
| Analytics Service down | Serve Redis-cached KPIs + stale banner |
| DB connection lost | `503 Service Unavailable` + `Retry-After: 30` header |
| Redis down | Fall back to direct DB query (log warning) |

---

## 10. OBSERVABILITY

### Structured Logging
```python
import structlog
logger = structlog.get_logger()

# Usage
logger.info("sale_created",
    transaction_id=tx.id,
    store_id=tx.store_id,
    amount=float(tx.total_amount),
    cashier_id=tx.cashier_id)
```
- Output as JSON → pipe to ELK Stack or Grafana Loki in production

### Prometheus Metrics
```python
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)
# Exposes GET /metrics for Prometheus scraping
```
- **Key metrics:** `http_request_duration_seconds`, `http_requests_total`
- **Custom:** `sales_total_counter`, `anomaly_flags_counter`

### Health Checks
```python
@app.get("/health")
async def health(db=Depends(get_db)):
    try:
        await db.execute("SELECT 1")
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok" if db_ok else "degraded", "db": db_ok, "version": "1.0.0"}
```

### Tracing (Optional)
- Add `opentelemetry-instrumentation-fastapi` if time permits
- Send traces to Jaeger or Grafana Tempo

---

## 11. AI GUARDRAILS

### SQL Validation
```python
import re, sqlparse

FORBIDDEN = [
    r"\bDROP\b", r"\bDELETE\b", r"\bTRUNCATE\b", r"\bUPDATE\b",
    r"\bINSERT\b", r"\bGRANT\b", r"\bEXEC\b", r"\bhashed_password\b",
    r"--", r";.*;",                # stacked queries
    r"\bINFORMATION_SCHEMA\b"     # schema snooping
]

def validate_sql(sql: str) -> bool:
    upper = sql.strip().upper()
    if not upper.startswith("SELECT"):
        return False
    for pat in FORBIDDEN:
        if re.search(pat, upper):
            return False
    # Reject multi-statement
    return len(sqlparse.split(sql)) == 1

# Always use a dedicated read-only DB user for AI-generated queries
READ_ONLY_DB_URL = "postgresql+asyncpg://ro_user:pass@localhost/novamart"
```

### PII Masking
```python
MASKED_COLS = {"email", "hashed_password", "phone", "aadhaar"}

def mask_result(columns: list[str], rows: list[tuple]) -> list[dict]:
    return [
        {col: "***" if col in MASKED_COLS else val
         for col, val in zip(columns, row)}
        for row in rows
    ]
```

### Prompt Injection Defense
```python
BLOCKED = ["ignore previous", "system prompt", "jailbreak",
           "drop table", "shutdown", "<|im_start|>"]

def is_safe_input(text: str) -> bool:
    lower = text.lower()
    return not any(b in lower for b in BLOCKED)

# In endpoint:
if not is_safe_input(body.query):
    raise HTTPException(400, "Query contains disallowed content")
```

### Result Guardrails
- Cap rows returned: `LIMIT 500` appended to every generated SQL
- Never expose raw DB error messages to client (log internally, return generic 500)
- Log every query + generated SQL to `ai_query_log.flagged` for audit review

---

## 12. SETUP GUIDE

### Prerequisites
```
Python 3.11+     https://python.org/downloads
Node 18+         https://nodejs.org
Docker Desktop   https://docker.com/products/docker-desktop
Git              https://git-scm.com
```

### Step 1 — Project Scaffold
```bash
mkdir novamart && cd novamart
mkdir -p services/auth services/inventory services/sales services/analytics services/ai frontend

# novamart/
# ├── services/
# │   ├── auth/        (FastAPI app + Dockerfile + requirements.txt)
# │   ├── inventory/
# │   ├── sales/
# │   ├── analytics/
# │   └── ai/
# ├── frontend/        (Vite + React)
# ├── docker-compose.yml
# ├── nginx.conf
# └── .env
```

### Step 2 — PostgreSQL via Docker
```bash
docker run -d \
  --name novamart-pg \
  -e POSTGRES_USER=novamart \
  -e POSTGRES_PASSWORD=novamart123 \
  -e POSTGRES_DB=novamart \
  -p 5432:5432 \
  postgres:15-alpine
```

### Step 3 — Redis via Docker
```bash
docker run -d \
  --name novamart-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Step 4 — Python Virtualenv (per service)
```bash
cd services/auth
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### Step 5 — Install Dependencies
```bash
pip install \
  fastapi==0.111.0 \
  uvicorn[standard]==0.29.0 \
  sqlalchemy[asyncio]==2.0.30 \
  asyncpg==0.29.0 \
  alembic==1.13.1 \
  python-jose[cryptography]==3.3.0 \
  passlib[bcrypt]==1.7.4 \
  pydantic-settings==2.2.1 \
  slowapi==0.1.9 \
  structlog==24.1.0 \
  prometheus-fastapi-instrumentator==7.0.0 \
  tenacity==8.3.0 \
  redis==5.0.4 \
  openai==1.30.1 \
  sqlparse==0.5.0 \
  numpy==1.26.4 \
  httpx==0.27.0

pip freeze > requirements.txt
```

### Step 6 — `.env` File
```env
# Database
DATABASE_URL=postgresql+asyncpg://novamart:novamart123@localhost:5432/novamart
READONLY_DB_URL=postgresql+asyncpg://novamart_ro:ro_pass@localhost:5432/novamart

# Auth
SECRET_KEY=change-me-to-a-256-bit-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Redis
REDIS_URL=redis://localhost:6379/0

# AI
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini

# App
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Step 7 — FastAPI App Skeleton
```python
# services/auth/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import auth, users
from app.database import engine, Base
import structlog

app = FastAPI(title="NovaMart Auth Service", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

Instrumentator().instrument(app).expose(app)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/auth/users", tags=["users"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth", "version": "1.0.0"}
```

### Step 8 — SQLAlchemy Async Setup
```python
# services/auth/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    echo=(settings.ENVIRONMENT == "development")
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

### Step 9 — Alembic Migrations
```bash
cd services/auth
alembic init migrations

# Edit alembic.ini line:
# sqlalchemy.url = postgresql+asyncpg://... (or read from env)

# Edit migrations/env.py to import your Base and models

alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

### Step 10 — Run Service Locally
```bash
# From service folder with venv active:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```
| Service | Port |
|---|---|
| Auth | 8001 |
| Inventory | 8002 |
| Sales | 8003 |
| Analytics | 8004 |
| AI | 8005 |

### Step 11 — Frontend (React + Vite)
```bash
cd frontend
npm create vite@latest . -- --template react
npm install axios react-router-dom recharts
npm run dev        # Starts on http://localhost:5173
```

---

## 13. DEPLOYMENT (BASIC)

### Dockerfile (per service)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Change port per service in compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### docker-compose.yml
```yaml
version: "3.9"

services:

  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: novamart
      POSTGRES_PASSWORD: novamart123
      POSTGRES_DB: novamart
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"

  auth-service:
    build: ./services/auth
    restart: always
    ports: ["8001:8001"]
    env_file: .env
    depends_on: [postgres]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001

  inventory-service:
    build: ./services/inventory
    restart: always
    ports: ["8002:8002"]
    env_file: .env
    depends_on: [postgres]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8002

  sales-service:
    build: ./services/sales
    restart: always
    ports: ["8003:8003"]
    env_file: .env
    depends_on: [postgres]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8003

  analytics-service:
    build: ./services/analytics
    restart: always
    ports: ["8004:8004"]
    env_file: .env
    depends_on: [postgres, redis]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8004

  ai-service:
    build: ./services/ai
    restart: always
    ports: ["8005:8005"]
    env_file: .env
    depends_on: [postgres, redis]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8005

  nginx:
    image: nginx:alpine
    restart: always
    ports: ["80:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - inventory-service
      - sales-service
      - analytics-service
      - ai-service

volumes:
  pg_data:
```

### nginx.conf
```nginx
events {}

http {
  upstream auth      { server auth-service:8001;      }
  upstream inventory { server inventory-service:8002;  }
  upstream sales     { server sales-service:8003;      }
  upstream analytics { server analytics-service:8004;  }
  upstream ai        { server ai-service:8005;         }

  server {
    listen 80;

    location /auth/      { proxy_pass http://auth/;      }
    location /inventory/ { proxy_pass http://inventory/; }
    location /sales/     { proxy_pass http://sales/;     }
    location /analytics/ { proxy_pass http://analytics/; }
    location /ai/        { proxy_pass http://ai/;        }
  }
}
```

### Commands
```bash
# Build & start all services
docker-compose up --build -d

# View logs for a service
docker-compose logs -f auth-service

# Run migrations inside container
docker-compose exec auth-service alembic upgrade head

# Scale a service (e.g., 3 replicas of sales)
docker-compose up -d --scale sales-service=3

# Stop all
docker-compose down

# Full reset (WARNING: deletes DB data)
docker-compose down -v
```

---

## HACKATHON PRIORITY SCHEDULE (40 Hours)

| Phase | Hours | Tasks |
|---|---|---|
| **Phase 1** | 0 – 6h | DB schema · Auth Service (login/JWT/RBAC) · Alembic migrations |
| **Phase 2** | 6 – 14h | Inventory Service · Sales/Billing Service · Basic POS endpoints |
| **Phase 3** | 14 – 20h | Frontend skeleton · Wire Auth + Inventory + Sales to UI |
| **Phase 4** | 20 – 26h | Analytics Service · KPI Dashboard UI (Recharts) |
| **Phase 5** | 26 – 32h | AI Service · Recommendations + Anomaly Detection |
| **Phase 6** | 32 – 36h | Text-to-SQL endpoint · Guardrails · Conversational UI |
| **Phase 7** | 36 – 38h | Docker Compose full stack · Nginx routing · .env wiring |
| **Phase 8** | 38 – 40h | Demo polish · README · slides · stress test happy path |

---

*NovaMart Retail Platform — Master.md v1.0 | Generated for 40-Hour Hackathon Sprint*
