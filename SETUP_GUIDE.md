# NovaMart — Step-by-Step Build Guide
> Follow this in order. Every command is copy-paste ready.

---

## PHASE 1: Prerequisites & Project Scaffold (Hour 0–1)

### Step 1.1 — Install Prerequisites (if not already installed)

**A) Python 3.11+**
- Go to: https://www.python.org/downloads/
- Click "Download Python 3.11.x"
- Run installer → ✅ CHECK "Add Python to PATH" at the bottom
- Click "Install Now"
- Verify: open CMD and type:
  ```
  python --version
  ```
  Should show: `Python 3.11.x`

**B) Node.js 18+**
- Go to: https://nodejs.org/en/download
- Download the LTS version (Windows Installer)
- Run installer, click Next → Next → Install
- Verify:
  ```
  node --version
  npm --version
  ```

**C) Docker Desktop**
- Go to: https://www.docker.com/products/docker-desktop/
- Click "Download for Windows"
- Run installer, restart PC when asked
- After restart, open Docker Desktop from Start Menu
- Wait for the whale icon in the taskbar to go GREEN (Docker is running)
- Verify:
  ```
  docker --version
  ```

**D) VS Code (Recommended)**
- Go to: https://code.visualstudio.com/
- Install extensions:
  - Python (Microsoft)
  - REST Client (Huachao Mao) — for testing APIs
  - PostgreSQL (Chris Kolkman)
  - Docker (Microsoft)

---

### Step 1.2 — Create Project Folder Structure

Open CMD (Win + R → type `cmd` → Enter) and run these commands ONE BY ONE:

```cmd
cd d:\B.Tech\centific
```

```cmd
mkdir novamart
cd novamart
```

```cmd
mkdir services\auth\app\routers
mkdir services\auth\app\models
mkdir services\auth\app\schemas
mkdir services\auth\migrations
```

```cmd
mkdir services\inventory\app\routers
mkdir services\inventory\app\models
mkdir services\inventory\app\schemas
mkdir services\inventory\migrations
```

```cmd
mkdir services\sales\app\routers
mkdir services\sales\app\models
mkdir services\sales\app\schemas
mkdir services\sales\migrations
```

```cmd
mkdir services\analytics\app\routers
mkdir services\analytics\migrations
```

```cmd
mkdir services\ai\app\routers
mkdir services\ai\migrations
```

```cmd
mkdir frontend
```

Now open this folder in VS Code:
```cmd
code .
```

---

## PHASE 2: PostgreSQL via Docker (Hour 1–2)

### Step 2.1 — Start PostgreSQL Container

Open a NEW terminal in VS Code (Terminal → New Terminal) and run:

```cmd
docker run -d ^
  --name novamart-pg ^
  -e POSTGRES_USER=novamart ^
  -e POSTGRES_PASSWORD=novamart123 ^
  -e POSTGRES_DB=novamart ^
  -p 5432:5432 ^
  postgres:15-alpine
```

Verify it's running:
```cmd
docker ps
```
You should see `novamart-pg` in the list with status `Up`.

### Step 2.2 — Connect to PostgreSQL & Create Tables

Connect into the container's psql shell:
```cmd
docker exec -it novamart-pg psql -U novamart -d novamart
```

You'll see the `novamart=#` prompt. Now run this SQL to create all tables:

```sql
-- Step 1: stores
CREATE TABLE stores (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  city      VARCHAR(100),
  region    VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
);

-- Step 2: roles
CREATE TABLE roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}'
);

-- Step 3: users
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

-- Step 4: products
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

-- Step 5: inventory
CREATE TABLE inventory (
  id           SERIAL PRIMARY KEY,
  store_id     INT REFERENCES stores(id),
  product_id   INT REFERENCES products(id),
  quantity     INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

-- Step 6: stock_movements
CREATE TABLE stock_movements (
  id           SERIAL PRIMARY KEY,
  store_id     INT REFERENCES stores(id),
  product_id   INT REFERENCES products(id),
  type         VARCHAR(10) NOT NULL,
  qty          INT NOT NULL,
  reference_id INT,
  moved_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: transactions
CREATE TABLE transactions (
  id             SERIAL PRIMARY KEY,
  store_id       INT REFERENCES stores(id),
  cashier_id     INT REFERENCES users(id),
  total_amount   NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(30),
  status         VARCHAR(20) DEFAULT 'completed',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: transaction_items
CREATE TABLE transaction_items (
  id             SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  product_id     INT REFERENCES products(id),
  qty            INT NOT NULL,
  unit_price     NUMERIC(10,2) NOT NULL,
  discount       NUMERIC(5,2) DEFAULT 0
);

-- Step 9: returns
CREATE TABLE returns (
  id             SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id),
  reason         TEXT,
  refund_amount  NUMERIC(10,2),
  processed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Step 10: audit_log
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id   INT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 11: ai_query_log
CREATE TABLE ai_query_log (
  id             SERIAL PRIMARY KEY,
  user_id        INT REFERENCES users(id),
  raw_query      TEXT NOT NULL,
  generated_sql  TEXT,
  result_preview JSONB,
  executed_at    TIMESTAMPTZ DEFAULT NOW(),
  flagged        BOOLEAN DEFAULT FALSE
);

-- Step 12: anomaly_flags
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

Then add indexes:
```sql
CREATE INDEX idx_inventory_store    ON inventory(store_id);
CREATE INDEX idx_inventory_product  ON inventory(product_id);
CREATE INDEX idx_transactions_store ON transactions(store_id, created_at DESC);
CREATE INDEX idx_tx_items_txn       ON transaction_items(transaction_id);
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_audit_user         ON audit_log(user_id, created_at DESC);
```

Seed initial roles and a store:
```sql
INSERT INTO roles (name, permissions) VALUES
  ('regional_admin',       '{"all": true}'),
  ('store_manager',        '{"store": "full"}'),
  ('inventory_supervisor', '{"inventory": "full"}'),
  ('sales_associate',      '{"sales": "create", "products": "read"}');

INSERT INTO stores (name, city, region) VALUES
  ('NovaMart - Koramangala', 'Bangalore', 'South India'),
  ('NovaMart - Andheri',     'Mumbai',    'West India'),
  ('NovaMart - Connaught',   'Delhi',     'North India');
```

Exit psql:
```sql
\q
```

---

## PHASE 3: Auth Service — FastAPI Backend (Hour 2–6)

### Step 3.1 — Create Virtual Environment

```cmd
cd d:\B.Tech\centific\novamart\services\auth
python -m venv venv
venv\Scripts\activate
```

You'll see `(venv)` at the start of the line — that means it's active.

### Step 3.2 — Install Dependencies

```cmd
pip install fastapi==0.111.0 uvicorn[standard]==0.29.0 sqlalchemy[asyncio]==2.0.30 asyncpg==0.29.0 alembic==1.13.1 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 pydantic-settings==2.2.1 slowapi==0.1.9 structlog==24.1.0 prometheus-fastapi-instrumentator==7.0.0 tenacity==8.3.0 redis==5.0.4 httpx==0.27.0 python-multipart==0.0.9
```

Save dependencies:
```cmd
pip freeze > requirements.txt
```

### Step 3.3 — Create `.env` File

In VS Code, create file: `d:\B.Tech\centific\novamart\.env`

```env
DATABASE_URL=postgresql+asyncpg://novamart:novamart123@localhost:5432/novamart
SECRET_KEY=super-secret-key-change-this-in-production-256bits
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Step 3.4 — Create App Config

Create file: `services/auth/app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REDIS_URL: str = "redis://localhost:6379/0"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = "../../.env"   # points to novamart/.env

settings = Settings()
```

### Step 3.5 — Create Database Connection

Create file: `services/auth/app/database.py`
```python
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

### Step 3.6 — Create User Model

Create file: `services/auth/app/models/user.py`
```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class Role(Base):
    __tablename__ = "roles"
    id          = Column(Integer, primary_key=True)
    name        = Column(String(50), unique=True, nullable=False)

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
```

Create file: `services/auth/app/models/__init__.py`
```python
from app.models.user import User, Role
```

### Step 3.7 — Create Pydantic Schemas

Create file: `services/auth/app/schemas/auth.py`
```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role_id: int
    store_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: str
    email: str
    role: str
    store_id: Optional[int]

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role_id: int
    store_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True
```

### Step 3.8 — Create Security Utilities

Create file: `services/auth/app/security.py`
```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire, "type": "access"})
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    data.update({"exp": expire, "type": "refresh"})
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
```

### Step 3.9 — Create Auth Router

Create file: `services/auth/app/routers/auth.py`
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User, Role
from app.schemas.auth import UserCreate, UserLogin, Token, UserOut
from app.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Register ──────────────────────────────────────────────
@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate email
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role_id=body.role_id,
        store_id=body.store_id
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# ── Login ─────────────────────────────────────────────────
@router.post("/login", response_model=Token)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account deactivated")

    # get role name
    role_result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = role_result.scalar_one_or_none()
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

# ── Get current user ──────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    data = decode_token(token)
    if not data or data.get("type") != "access":
        raise HTTPException(401, "Invalid or expired token")
    result = await db.execute(select(User).where(User.id == int(data["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")
    return user

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
```

Create file: `services/auth/app/routers/__init__.py`
```python
```

### Step 3.10 — Create Main App Entry Point

Create file: `services/auth/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.auth import router as auth_router
import structlog

logger = structlog.get_logger()

app = FastAPI(
    title="NovaMart Auth Service",
    version="1.0.0",
    docs_url="/auth/docs",
    redoc_url="/auth/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Instrumentator().instrument(app).expose(app)
app.include_router(auth_router, prefix="/auth", tags=["Auth"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth", "version": "1.0.0"}
```

Create file: `services/auth/app/__init__.py`
```python
```

### Step 3.11 — Run the Auth Service

Make sure you are in:
```cmd
cd d:\B.Tech\centific\novamart\services\auth
venv\Scripts\activate
```

Run:
```cmd
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Now open browser: http://localhost:8001/auth/docs

You'll see the Swagger UI — test Register and Login here!

---

## PHASE 4: Test Auth APIs (Hour 4)

### Step 4.1 — Test via Swagger UI (http://localhost:8001/auth/docs)

**Register a user:**
1. Click `POST /auth/register` → Click "Try it out"
2. Paste this body:
   ```json
   {
     "name": "Admin User",
     "email": "admin@novamart.com",
     "password": "admin123",
     "role_id": 1,
     "store_id": null
   }
   ```
3. Click Execute → should return `201` with user data

**Login:**
1. Click `POST /auth/login` → Try it out
2. Paste:
   ```json
   {
     "email": "admin@novamart.com",
     "password": "admin123"
   }
   ```
3. Copy the `access_token` from response

**Get current user:**
1. Click the 🔒 Authorize button at the top right
2. Paste your access_token
3. Click `GET /auth/me` → Try it out → Execute

---

## PHASE 5: Inventory Service (Hour 6–10)

### Step 5.1 — Setup Inventory Service

```cmd
cd d:\B.Tech\centific\novamart\services\inventory
python -m venv venv
venv\Scripts\activate
pip install fastapi==0.111.0 uvicorn[standard]==0.29.0 sqlalchemy[asyncio]==2.0.30 asyncpg==0.29.0 passlib[bcrypt]==1.7.4 python-jose[cryptography]==3.3.0 pydantic-settings==2.2.1 prometheus-fastapi-instrumentator==7.0.0 python-multipart==0.0.9
pip freeze > requirements.txt
```

### Step 5.2 — Copy config and database files

Copy `app/config.py` and `app/database.py` from auth service — they are identical.

### Step 5.3 — Create Inventory Models

Create file: `services/inventory/app/models/inventory.py`
```python
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    id            = Column(Integer, primary_key=True)
    sku           = Column(String(50), unique=True, nullable=False)
    name          = Column(String(200), nullable=False)
    category      = Column(String(100))
    unit          = Column(String(20), default="piece")
    price         = Column(Numeric(10, 2), nullable=False)
    cost_price    = Column(Numeric(10, 2))
    reorder_level = Column(Integer, default=10)

class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (UniqueConstraint("store_id", "product_id"),)
    id           = Column(Integer, primary_key=True)
    store_id     = Column(Integer, ForeignKey("stores.id"))
    product_id   = Column(Integer, ForeignKey("products.id"))
    quantity     = Column(Integer, default=0)
    last_updated = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id           = Column(Integer, primary_key=True)
    store_id     = Column(Integer, ForeignKey("stores.id"))
    product_id   = Column(Integer, ForeignKey("products.id"))
    type         = Column(String(10), nullable=False)  # IN / OUT / ADJ
    qty          = Column(Integer, nullable=False)
    reference_id = Column(Integer)
    moved_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())
```

### Step 5.4 — Create Inventory Router

Create file: `services/inventory/app/routers/inventory.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.inventory import Product, Inventory, StockMovement
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProductCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    unit: str = "piece"
    price: float
    cost_price: Optional[float] = None
    reorder_level: int = 10

class StockAdjust(BaseModel):
    store_id: int
    product_id: int
    qty: int
    type: str  # IN / OUT / ADJ

# GET all inventory for a store
@router.get("/{store_id}")
async def get_inventory(store_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .where(Inventory.store_id == store_id)
    )
    rows = result.all()
    return [
        {
            "product_id": inv.product_id,
            "sku": prod.sku,
            "name": prod.name,
            "category": prod.category,
            "quantity": inv.quantity,
            "reorder_level": prod.reorder_level,
            "price": float(prod.price),
        }
        for inv, prod in rows
    ]

# GET replenishment alerts
@router.get("/alerts/{store_id}")
async def get_alerts(store_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .where(
            Inventory.store_id == store_id,
            Inventory.quantity <= Product.reorder_level
        )
    )
    rows = result.all()
    return {
        "alerts": [
            {
                "product_id": inv.product_id,
                "sku": prod.sku,
                "name": prod.name,
                "quantity": inv.quantity,
                "reorder_level": prod.reorder_level
            }
            for inv, prod in rows
        ]
    }

# POST add product
@router.post("/products", status_code=201)
async def add_product(body: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**body.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

# PUT adjust stock
@router.put("/stock/adjust")
async def adjust_stock(body: StockAdjust, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Inventory).where(
            Inventory.store_id == body.store_id,
            Inventory.product_id == body.product_id
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        # Create inventory record
        inv = Inventory(store_id=body.store_id, product_id=body.product_id, quantity=0)
        db.add(inv)

    if body.type == "IN":
        inv.quantity += body.qty
    elif body.type == "OUT":
        if inv.quantity < body.qty:
            raise HTTPException(400, "Insufficient stock")
        inv.quantity -= body.qty
    else:  # ADJ
        inv.quantity = body.qty

    movement = StockMovement(
        store_id=body.store_id,
        product_id=body.product_id,
        type=body.type,
        qty=body.qty
    )
    db.add(movement)
    await db.commit()
    return {"message": "Stock updated", "new_quantity": inv.quantity}
```

### Step 5.5 — Create Inventory main.py

Create file: `services/inventory/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.inventory import router as inv_router

app = FastAPI(title="NovaMart Inventory Service", version="1.0.0",
              docs_url="/inventory/docs")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

Instrumentator().instrument(app).expose(app)
app.include_router(inv_router, prefix="/inventory", tags=["Inventory"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "inventory"}
```

### Step 5.6 — Run Inventory Service

Open a NEW terminal:
```cmd
cd d:\B.Tech\centific\novamart\services\inventory
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

Test at: http://localhost:8002/inventory/docs

---

## PHASE 6: Sales Service (Hour 10–14)

### Step 6.1 — Setup Sales Service

```cmd
cd d:\B.Tech\centific\novamart\services\sales
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg pydantic-settings python-jose[cryptography] passlib[bcrypt] prometheus-fastapi-instrumentator python-multipart
pip freeze > requirements.txt
```

### Step 6.2 — Create Sales Models

Create file: `services/sales/app/models/sales.py`
```python
from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, TIMESTAMP, Text
from sqlalchemy.sql import func
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    id             = Column(Integer, primary_key=True)
    store_id       = Column(Integer, ForeignKey("stores.id"))
    cashier_id     = Column(Integer, ForeignKey("users.id"))
    total_amount   = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(30))
    status         = Column(String(20), default="completed")
    created_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())

class TransactionItem(Base):
    __tablename__ = "transaction_items"
    id             = Column(Integer, primary_key=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_id     = Column(Integer, ForeignKey("products.id"))
    qty            = Column(Integer, nullable=False)
    unit_price     = Column(Numeric(10, 2), nullable=False)
    discount       = Column(Numeric(5, 2), default=0)
```

### Step 6.3 — Create Sales Router

Create file: `services/sales/app/routers/sales.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.database import get_db
from app.models.sales import Transaction, TransactionItem
from pydantic import BaseModel
from typing import List, Optional
from datetime import date

router = APIRouter()

class SaleItem(BaseModel):
    product_id: int
    qty: int
    unit_price: float
    discount: float = 0.0

class SaleCreate(BaseModel):
    store_id: int
    cashier_id: int
    payment_method: str
    items: List[SaleItem]

# POST create sale
@router.post("/", status_code=201)
async def create_sale(body: SaleCreate, db: AsyncSession = Depends(get_db)):
    total = sum(
        (item.unit_price * item.qty) - item.discount
        for item in body.items
    )
    txn = Transaction(
        store_id=body.store_id,
        cashier_id=body.cashier_id,
        total_amount=total,
        payment_method=body.payment_method
    )
    db.add(txn)
    await db.flush()  # get txn.id before commit

    for item in body.items:
        db.add(TransactionItem(
            transaction_id=txn.id,
            product_id=item.product_id,
            qty=item.qty,
            unit_price=item.unit_price,
            discount=item.discount
        ))

    await db.commit()
    return {
        "transaction_id": txn.id,
        "total_amount": float(total),
        "status": "completed",
        "receipt_url": f"/sales/receipt/{txn.id}"
    }

# GET store sales
@router.get("/{store_id}")
async def list_sales(store_id: int, limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.store_id == store_id)
        .order_by(desc(Transaction.created_at))
        .limit(limit).offset(offset)
    )
    return result.scalars().all()

# GET transaction detail
@router.get("/transaction/{txn_id}")
async def get_transaction(txn_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(404, "Transaction not found")

    items_result = await db.execute(
        select(TransactionItem).where(TransactionItem.transaction_id == txn_id)
    )
    items = items_result.scalars().all()
    return {"transaction": txn, "items": items}

# GET daily summary
@router.get("/summary/{store_id}")
async def daily_summary(store_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.date(Transaction.created_at).label("day"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.id).label("tx_count")
        )
        .where(Transaction.store_id == store_id)
        .group_by(func.date(Transaction.created_at))
        .order_by(desc("day"))
        .limit(30)
    )
    rows = result.all()
    return [{"day": str(r.day), "revenue": float(r.revenue), "tx_count": r.tx_count} for r in rows]
```

### Step 6.4 — Sales main.py

Create file: `services/sales/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.sales import router as sales_router

app = FastAPI(title="NovaMart Sales Service", version="1.0.0",
              docs_url="/sales/docs")
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
Instrumentator().instrument(app).expose(app)
app.include_router(sales_router, prefix="/sales", tags=["Sales"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "sales"}
```

### Step 6.5 — Run Sales Service

```cmd
cd d:\B.Tech\centific\novamart\services\sales
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

Test at: http://localhost:8003/sales/docs

---

## PHASE 7: React Frontend (Hour 14–20)

### Step 7.1 — Create React App

```cmd
cd d:\B.Tech\centific\novamart\frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom recharts
```

### Step 7.2 — Run Frontend

```cmd
npm run dev
```

Open: http://localhost:5173

---

## PHASE 8: Docker Compose (Hour 36–38)

### Step 8.1 — Create Dockerfiles

For each service, create `services/auth/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```
(Change port to 8002/8003/8004/8005 for other services)

### Step 8.2 — Run Full Stack

```cmd
cd d:\B.Tech\centific\novamart
docker-compose up --build -d
```

Check all running:
```cmd
docker-compose ps
```

---

## QUICK REFERENCE — Running Services

| Service | Command | URL |
|---|---|---|
| Auth | `uvicorn app.main:app --reload --port 8001` | http://localhost:8001/auth/docs |
| Inventory | `uvicorn app.main:app --reload --port 8002` | http://localhost:8002/inventory/docs |
| Sales | `uvicorn app.main:app --reload --port 8003` | http://localhost:8003/sales/docs |
| Analytics | `uvicorn app.main:app --reload --port 8004` | http://localhost:8004/analytics/docs |
| AI | `uvicorn app.main:app --reload --port 8005` | http://localhost:8005/ai/docs |
| Frontend | `npm run dev` | http://localhost:5173 |

## TROUBLESHOOTING

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Make sure venv is activated: `venv\Scripts\activate` |
| `Connection refused 5432` | Check Docker: `docker ps` → restart with `docker start novamart-pg` |
| `Address already in use` | Kill process: `netstat -ano \| findstr :8001` then `taskkill /PID <pid> /F` |
| `asyncpg.exceptions` | Check DATABASE_URL in .env has `postgresql+asyncpg://` prefix |
