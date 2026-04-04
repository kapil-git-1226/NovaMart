from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, TIMESTAMP, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Store(Base):
    """Reference model for FK resolution."""
    __tablename__ = "stores"
    id        = Column(Integer, primary_key=True)
    name      = Column(String(100))
    is_active = Column(Boolean, default=True)


class User(Base):
    """Reference model for FK resolution."""
    __tablename__ = "users"
    id    = Column(Integer, primary_key=True)
    name  = Column(String(100))
    email = Column(String(150))


class Transaction(Base):
    """A single sale/billing event at a store POS."""
    __tablename__ = "transactions"

    id             = Column(Integer, primary_key=True, index=True)
    store_id       = Column(Integer, ForeignKey("stores.id"), nullable=False)
    cashier_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount   = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(30))   # cash / card / upi
    status         = Column(String(20), default="completed")
    created_at     = Column(TIMESTAMP(timezone=True), server_default=func.now())


class TransactionItem(Base):
    """Individual line items inside a transaction."""
    __tablename__ = "transaction_items"

    id             = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    product_id     = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty            = Column(Integer, nullable=False)
    unit_price     = Column(Numeric(10, 2), nullable=False)
    discount       = Column(Numeric(5, 2), default=0)


class Return(Base):
    """A return/refund against an existing transaction."""
    __tablename__ = "returns"

    id             = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    reason         = Column(Text)
    refund_amount  = Column(Numeric(10, 2))
    processed_at   = Column(TIMESTAMP(timezone=True), server_default=func.now())
