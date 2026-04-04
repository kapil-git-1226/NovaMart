from pydantic import BaseModel
from typing import List, Optional


class SaleItem(BaseModel):
    product_id: int
    qty: int
    unit_price: float
    discount: float = 0.0


class SaleCreate(BaseModel):
    store_id: int
    cashier_id: int
    payment_method: str   # cash / card / upi
    items: List[SaleItem]


class SaleOut(BaseModel):
    transaction_id: int
    total_amount: float
    status: str
    receipt_url: str


class TransactionItemOut(BaseModel):
    id: int
    product_id: int
    qty: int
    unit_price: float
    discount: float

    class Config:
        from_attributes = True


class TransactionOut(BaseModel):
    id: int
    store_id: int
    cashier_id: int
    total_amount: float
    payment_method: Optional[str]
    status: str
    created_at: str

    class Config:
        from_attributes = True


class ReturnCreate(BaseModel):
    reason: Optional[str] = None
    refund_amount: float


class DailySummaryItem(BaseModel):
    day: str
    revenue: float
    tx_count: int
