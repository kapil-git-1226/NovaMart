from sqlalchemy import (
    Column, Integer, String, Numeric, ForeignKey,
    TIMESTAMP, UniqueConstraint, Boolean
)
from sqlalchemy.sql import func
from app.database import Base


class Store(Base):
    """Lightweight reference model — SQLAlchemy needs this to resolve store_id FK."""
    __tablename__ = "stores"
    id        = Column(Integer, primary_key=True)
    name      = Column(String(100))
    city      = Column(String(100))
    region    = Column(String(100))
    is_active = Column(Boolean, default=True)


class Product(Base):
    """Represents a product/SKU in the NovaMart catalog."""
    __tablename__ = "products"

    id            = Column(Integer, primary_key=True, index=True)
    sku           = Column(String(50), unique=True, nullable=False, index=True)
    name          = Column(String(200), nullable=False)
    category      = Column(String(100))
    unit          = Column(String(20), default="piece")
    price         = Column(Numeric(10, 2), nullable=False)
    cost_price    = Column(Numeric(10, 2))
    reorder_level = Column(Integer, default=10)


class Inventory(Base):
    """Tracks how much of each product is in each store."""
    __tablename__ = "inventory"
    __table_args__ = (UniqueConstraint("store_id", "product_id"),)

    id           = Column(Integer, primary_key=True, index=True)
    store_id     = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity     = Column(Integer, nullable=False, default=0)
    last_updated = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class StockMovement(Base):
    """Audit trail for every stock change — IN (received), OUT (sold), ADJ (manual)."""
    __tablename__ = "stock_movements"

    id           = Column(Integer, primary_key=True, index=True)
    store_id     = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    type         = Column(String(10), nullable=False)  # IN / OUT / ADJ
    qty          = Column(Integer, nullable=False)
    reference_id = Column(Integer, nullable=True)      # e.g. transaction_id
    moved_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())
