from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from app.database import get_db
from app.models.sales import Transaction, TransactionItem, Return, Product, Store, User, Inventory, StockMovement
from app.schemas.sales import (
    SaleCreate, SaleOut, ReturnCreate,
    TransactionItemOut, DailySummaryItem
)

router = APIRouter()


# ══════════════════════════════════════════════════════════
#  STATIC / SPECIFIC PATHS FIRST — always before wildcards
# ══════════════════════════════════════════════════════════

# ── POST /sales/ ──────────────────────────────────────────
@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(body: SaleCreate, db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    # ── Pre-flight: verify all stock is available ─────────
    for item in body.items:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.store_id == body.store_id,
                Inventory.product_id == item.product_id
            )
            .first()
        )
        if not inv or inv.quantity < item.qty:
            prod = db.query(Product).filter(Product.id == item.product_id).first()
            name = prod.name if prod else f"Product #{item.product_id}"
            available = inv.quantity if inv else 0
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{name}'. "
                       f"Requested: {item.qty}, Available: {available}"
            )

    # ── Create transaction header ─────────────────────────
    total = sum((item.unit_price * item.qty) - item.discount for item in body.items)

    txn = Transaction(
        store_id=body.store_id,
        cashier_id=body.cashier_id,
        total_amount=round(total, 2),
        payment_method=body.payment_method,
        status="completed"
    )
    db.add(txn)
    db.flush()  # get txn.id

    # ── Add line items, deduct stock, log movements ───────
    for item in body.items:
        # Line item
        db.add(TransactionItem(
            transaction_id=txn.id,
            product_id=item.product_id,
            qty=item.qty,
            unit_price=item.unit_price,
            discount=item.discount
        ))

        # Deduct inventory
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.store_id == body.store_id,
                Inventory.product_id == item.product_id
            )
            .first()
        )
        inv.quantity -= item.qty

        # Audit trail in stock_movements
        db.add(StockMovement(
            store_id=body.store_id,
            product_id=item.product_id,
            type="OUT",
            qty=item.qty,
            reference_id=txn.id
        ))

    db.commit()
    db.refresh(txn)

    return SaleOut(
        transaction_id=txn.id,
        total_amount=float(txn.total_amount),
        status=txn.status,
        receipt_url=f"/sales/receipt/{txn.id}"
    )


# ── GET /sales/receipt/{txn_id} ───────────────────────────
@router.get("/receipt/{txn_id}")
def get_receipt(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Receipt not found")

    store = db.query(Store).filter(Store.id == txn.store_id).first()
    cashier = db.query(User).filter(User.id == txn.cashier_id).first()

    rows = (
        db.query(TransactionItem, Product)
        .join(Product, TransactionItem.product_id == Product.id)
        .filter(TransactionItem.transaction_id == txn_id)
        .all()
    )

    return {
        "transaction_id": txn.id,
        "store_name": store.name if store else f"Store #{txn.store_id}",
        "cashier_name": cashier.name if cashier else f"Cashier #{txn.cashier_id}",
        "date": str(txn.created_at),
        "payment_method": txn.payment_method,
        "items": [
            {
                "product_id": item.product_id,
                "sku": prod.sku,
                "name": prod.name,
                "qty": item.qty,
                "unit_price": float(item.unit_price),
                "discount": float(item.discount),
                "subtotal": round(float(item.unit_price) * item.qty - float(item.discount), 2)
            }
            for item, prod in rows
        ],
        "total_amount": float(txn.total_amount),
        "status": txn.status
    }


# ── GET /sales/transaction/{txn_id} ──────────────────────
@router.get("/transaction/{txn_id}")
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    items = db.query(TransactionItem).filter(TransactionItem.transaction_id == txn_id).all()

    return {
        "transaction": {
            "id": txn.id,
            "store_id": txn.store_id,
            "cashier_id": txn.cashier_id,
            "total_amount": float(txn.total_amount),
            "payment_method": txn.payment_method,
            "status": txn.status,
            "created_at": str(txn.created_at)
        },
        "items": [
            {
                "product_id": i.product_id,
                "qty": i.qty,
                "unit_price": float(i.unit_price),
                "discount": float(i.discount),
                "line_total": round(float(i.unit_price) * i.qty - float(i.discount), 2)
            }
            for i in items
        ]
    }


# ── GET /sales/summary/{store_id} ────────────────────────
@router.get("/summary/{store_id}")
def daily_summary(store_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.date(Transaction.created_at).label("day"),
            func.sum(Transaction.total_amount).label("revenue"),
            func.count(Transaction.id).label("tx_count")
        )
        .filter(Transaction.store_id == store_id)
        .group_by(func.date(Transaction.created_at))
        .order_by(desc("day"))
        .limit(30)
        .all()
    )
    return {
        "store_id": store_id,
        "summary": [
            {"day": str(r.day), "revenue": float(r.revenue), "tx_count": r.tx_count}
            for r in rows
        ]
    }


# ── POST /sales/return/{txn_id} ───────────────────────────
@router.post("/return/{txn_id}", status_code=201)
def process_return(txn_id: int, body: ReturnCreate, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status == "returned":
        raise HTTPException(status_code=400, detail="Transaction already returned")
    if body.refund_amount > float(txn.total_amount):
        raise HTTPException(
            status_code=400,
            detail=f"Refund ({body.refund_amount}) exceeds total ({float(txn.total_amount)})"
        )

    ret = Return(transaction_id=txn_id, reason=body.reason, refund_amount=body.refund_amount)
    txn.status = "returned"
    db.add(ret)
    db.commit()

    return {
        "message": "Return processed successfully",
        "transaction_id": txn_id,
        "refund_amount": body.refund_amount,
        "reason": body.reason
    }


# ══════════════════════════════════════════════════════════
#  WILDCARD PATHS LAST
# ══════════════════════════════════════════════════════════

# ── GET /sales/{store_id} ─────────────────────────────────
@router.get("/{store_id}")
def list_sales(store_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    txns = (
        db.query(Transaction)
        .filter(Transaction.store_id == store_id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [
        {
            "id": t.id,
            "store_id": t.store_id,
            "cashier_id": t.cashier_id,
            "total_amount": float(t.total_amount),
            "payment_method": t.payment_method,
            "status": t.status,
            "created_at": str(t.created_at)
        }
        for t in txns
    ]
