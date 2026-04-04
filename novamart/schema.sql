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

-- Indexes
CREATE INDEX idx_inventory_store    ON inventory(store_id);
CREATE INDEX idx_inventory_product  ON inventory(product_id);
CREATE INDEX idx_transactions_store ON transactions(store_id, created_at DESC);
CREATE INDEX idx_tx_items_txn       ON transaction_items(transaction_id);
CREATE INDEX idx_users_email        ON users(email);
CREATE INDEX idx_audit_user         ON audit_log(user_id, created_at DESC);

-- Initial Data Seeding
INSERT INTO roles (name, permissions) VALUES
  ('regional_admin',       '{"all": true}'),
  ('store_manager',        '{"store": "full"}'),
  ('inventory_supervisor', '{"inventory": "full"}'),
  ('sales_associate',      '{"sales": "create", "products": "read"}');

INSERT INTO stores (name, city, region) VALUES
  ('NovaMart - Koramangala', 'Bangalore', 'South India'),
  ('NovaMart - Andheri',     'Mumbai',    'West India'),
  ('NovaMart - Connaught',   'Delhi',     'North India');
