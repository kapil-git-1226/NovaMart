from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.inventory import Product, Inventory, StockMovement
from app.schemas.inventory import (
    ProductCreate, ProductOut, StockAdjust,
    InventoryItem, AlertItem
)

router = APIRouter()


# ══════════════════════════════════════════════════════════
#  STATIC / SPECIFIC PATHS FIRST — always before wildcards
# ══════════════════════════════════════════════════════════

# ── POST /inventory/products ──────────────────────────────
@router.post("/products", response_model=ProductOut, status_code=201)
def add_product(body: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.sku == body.sku).first():
        raise HTTPException(status_code=400, detail=f"SKU '{body.sku}' already exists")
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# ── GET /inventory/products/all ───────────────────────────
@router.get("/products/all", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.name).all()


# ── DELETE /inventory/products/{product_id} ───────────────
@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Clean up dependent inventory and movements to prevent FK errors
    db.query(Inventory).filter(Inventory.product_id == product_id).delete()
    db.query(StockMovement).filter(StockMovement.product_id == product_id).delete()
    
    # Optional: We are not handling sales/transaction_items here for brevity. 
    # If the product was sold, this would fail without cascading there too.
    try:
        db.delete(product)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete product. It may be linked to existing sales transactions.")

    return {"message": "Product deleted successfully"}


# ── PUT /inventory/products/{product_id} ─────────────────
@router.put("/products/{product_id}", response_model=ProductOut)
def edit_product(product_id: int, body: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check SKU collision with another product
    sku_conflict = (
        db.query(Product)
        .filter(Product.sku == body.sku, Product.id != product_id)
        .first()
    )
    if sku_conflict:
        raise HTTPException(status_code=400, detail=f"SKU '{body.sku}' is already used by another product")

    for field, value in body.model_dump().items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


# ── PUT /inventory/stock/adjust ───────────────────────────
@router.put("/stock/adjust")
def adjust_stock(body: StockAdjust, db: Session = Depends(get_db)):
    if body.type not in ("IN", "OUT", "ADJ"):
        raise HTTPException(status_code=400, detail="type must be IN, OUT, or ADJ")

    inv = (
        db.query(Inventory)
        .filter(Inventory.store_id == body.store_id, Inventory.product_id == body.product_id)
        .first()
    )
    if not inv:
        inv = Inventory(store_id=body.store_id, product_id=body.product_id, quantity=0)
        db.add(inv)
        db.flush()

    if body.type == "IN":
        inv.quantity += body.qty
    elif body.type == "OUT":
        if inv.quantity < body.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {inv.quantity}"
            )
        inv.quantity -= body.qty
    else:
        inv.quantity = body.qty

    movement = StockMovement(
        store_id=body.store_id,
        product_id=body.product_id,
        type=body.type,
        qty=body.qty
    )
    db.add(movement)
    db.commit()

    return {
        "message": "Stock updated successfully",
        "store_id": body.store_id,
        "product_id": body.product_id,
        "movement_type": body.type,
        "new_quantity": inv.quantity
    }


# ══════════════════════════════════════════════════════════
#  PARAMETERISED / WILDCARD PATHS LAST
# ══════════════════════════════════════════════════════════

# ── GET /inventory/alerts/{store_id} ─────────────────────
@router.get("/alerts/{store_id}")
def get_replenishment_alerts(store_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(
            Inventory.store_id == store_id,
            Inventory.quantity <= Product.reorder_level
        )
        .all()
    )
    alerts = [
        AlertItem(
            product_id=inv.product_id,
            sku=prod.sku,
            name=prod.name,
            quantity=inv.quantity,
            reorder_level=prod.reorder_level,
        )
        for inv, prod in rows
    ]
    return {"store_id": store_id, "alert_count": len(alerts), "alerts": alerts}


# ── GET /inventory/movements/{store_id} ──────────────────
@router.get("/movements/{store_id}")
def get_movements(store_id: int, limit: int = 100, db: Session = Depends(get_db)):
    rows = (
        db.query(StockMovement, Product)
        .join(Product, StockMovement.product_id == Product.id)
        .filter(StockMovement.store_id == store_id)
        .order_by(StockMovement.moved_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "movement_id": mov.id,
            "product_id": mov.product_id,
            "sku": prod.sku,
            "product_name": prod.name,
            "type": mov.type,
            "qty": mov.qty,
            "moved_at": str(mov.moved_at),
        }
        for mov, prod in rows
    ]


# ── GET /inventory/{store_id}/{product_id} ────────────────
@router.get("/{store_id}/{product_id}", response_model=InventoryItem)
def get_single_stock(store_id: int, product_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.store_id == store_id, Inventory.product_id == product_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Product not found in this store")
    inv, prod = row
    return InventoryItem(
        product_id=inv.product_id,
        sku=prod.sku,
        name=prod.name,
        category=prod.category,
        quantity=inv.quantity,
        reorder_level=prod.reorder_level,
        price=float(prod.price),
    )


# ── GET /inventory/{store_id} ─────────────────────────────
@router.get("/{store_id}", response_model=List[InventoryItem])
def get_store_inventory(store_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Inventory, Product)
        .join(Product, Inventory.product_id == Product.id)
        .filter(Inventory.store_id == store_id)
        .all()
    )
    return [
        InventoryItem(
            product_id=inv.product_id,
            sku=prod.sku,
            name=prod.name,
            category=prod.category,
            quantity=inv.quantity,
            reorder_level=prod.reorder_level,
            price=float(prod.price),
        )
        for inv, prod in rows
    ]
