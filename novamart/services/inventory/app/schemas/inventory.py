from pydantic import BaseModel
from typing import Optional, List


class ProductCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    unit: str = "piece"
    price: float
    cost_price: Optional[float] = None
    reorder_level: int = 10


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    category: Optional[str]
    unit: str
    price: float
    cost_price: Optional[float]
    reorder_level: int

    class Config:
        from_attributes = True


class StockAdjust(BaseModel):
    store_id: int
    product_id: int
    qty: int
    type: str   # IN / OUT / ADJ


class InventoryItem(BaseModel):
    product_id: int
    sku: str
    name: str
    category: Optional[str]
    quantity: int
    reorder_level: int
    price: float


class AlertItem(BaseModel):
    product_id: int
    sku: str
    name: str
    quantity: int
    reorder_level: int
