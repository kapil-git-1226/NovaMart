from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List

from app.database import get_db
from app.models.sales import Transaction, TransactionItem, Return
from app.schemas.sales import (
    SaleCreate, SaleOut, ReturnCreate,
    TransactionItemOut, DailySummaryItem
)

router = APIRouter()


# ── POST /sales/ ──────────────────────────────────────────
# Create a new sale — the main POS billing endpoint
@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(body: SaleCreate, db: Session = Depends(get_db)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    # Calculate total from line items
    total = sum(
        (item.unit_price * item.qty) - item.discount
        for item in body.items
    )

    txn = Transaction(
        store_id=body.store_id,
        cashier_id=body.cashier_id,
        total_amount=round(total, 2),
        payment_method=body.payment_method,
        status="completed"
    )
    db.add(txn)
    db.flush()   # flush to get txn.id before adding line items

    for item in body.items:
        db.add(TransactionItem(
            transaction_id=txn.id,
            product_id=item.product_id,
            qty=item.qty,
            unit_price=item.unit_price,
            discount=item.discount
        ))

    db.commit()

    return SaleOut(
        transaction_id=txn.id,
        total_amount=float(txn.total_amount),
        status=txn.status,
        receipt_url=f"/sales/receipt/{txn.id}"
    )


# ── GET /sales/{store_id} ─────────────────────────────────
# List all transactions for a store (paginated, newest first)
@router.get("/{store_id}")
def list_sales(
    store_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
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


# ── GET /sales/transaction/{id} ───────────────────────────
# Get full detail of a single transaction + its line items
@router.get("/transaction/{txn_id}")
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    items = (
        db.query(TransactionItem)
        .filter(TransactionItem.transaction_id == txn_id)
        .all()
    )

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


# ── GET /sales/receipt/{id} ───────────────────────────────
# Printable receipt (same as transaction detail, friendly format)
@router.get("/receipt/{txn_id}")
def get_receipt(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Receipt not found")

    items = db.query(TransactionItem).filter(TransactionItem.transaction_id == txn_id).all()

    return {
        "receipt": {
            "transaction_id": txn.id,
            "store_id": txn.store_id,
            "date": str(txn.created_at),
            "payment_method": txn.payment_method,
            "items": [
                {
                    "product_id": i.product_id,
                    "qty": i.qty,
                    "unit_price": float(i.unit_price),
                    "discount": float(i.discount),
                    "subtotal": round(float(i.unit_price) * i.qty - float(i.discount), 2)
                }
                for i in items
            ],
            "total_amount": float(txn.total_amount),
            "status": txn.status
        }
    }


# ── GET /sales/summary/{store_id} ────────────────────────
# Daily sales summary — last 30 days (revenue + count per day)
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
            {
                "day": str(r.day),
                "revenue": float(r.revenue),
                "tx_count": r.tx_count
            }
            for r in rows
        ]
    }


# ── POST /sales/return/{txn_id} ───────────────────────────
# Process a return/refund against an existing transaction
@router.post("/return/{txn_id}", status_code=201)
def process_return(
    txn_id: int,
    body: ReturnCreate,
    db: Session = Depends(get_db)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status == "returned":
        raise HTTPException(status_code=400, detail="Transaction already returned")

    if body.refund_amount > float(txn.total_amount):
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount ({body.refund_amount}) exceeds transaction total ({float(txn.total_amount)})"
        )

    ret = Return(
        transaction_id=txn_id,
        reason=body.reason,
        refund_amount=body.refund_amount
    )
    txn.status = "returned"
    db.add(ret)
    db.commit()

    return {
        "message": "Return processed successfully",
        "transaction_id": txn_id,
        "refund_amount": body.refund_amount,
        "reason": body.reason
    }
