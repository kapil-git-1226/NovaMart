from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.database import get_db

router = APIRouter()


# ── GET /analytics/kpis/{store_id} ───────────────────────
# Core KPIs: total revenue, number of transactions, average basket size
@router.get("/kpis/{store_id}")
def get_kpis(
    store_id: int,
    period: str = Query("7d", description="Time period: 1d, 7d, 30d, all"),
    db: Session = Depends(get_db)
):
    # Map period to a SQL interval
    interval_map = {"1d": "1 day", "7d": "7 days", "30d": "30 days", "all": None}
    interval = interval_map.get(period, "7 days")

    if interval:
        where_clause = f"WHERE store_id = :store_id AND created_at >= NOW() - INTERVAL '{interval}'"
    else:
        where_clause = "WHERE store_id = :store_id"

    result = db.execute(
        text(f"""
            SELECT
                COALESCE(SUM(total_amount), 0)  AS total_revenue,
                COUNT(*)                         AS total_transactions,
                COALESCE(AVG(total_amount), 0)  AS avg_basket_size,
                COALESCE(MAX(total_amount), 0)  AS max_transaction,
                COALESCE(MIN(total_amount), 0)  AS min_transaction
            FROM transactions
            {where_clause}
              AND status = 'completed'
        """),
        {"store_id": store_id}
    ).fetchone()

    return {
        "store_id": store_id,
        "period": period,
        "total_revenue": float(result.total_revenue),
        "total_transactions": result.total_transactions,
        "avg_basket_size": round(float(result.avg_basket_size), 2),
        "max_transaction": float(result.max_transaction),
        "min_transaction": float(result.min_transaction),
    }


# ── GET /analytics/top-products/{store_id} ───────────────
# Best-selling products by quantity sold
@router.get("/top-products/{store_id}")
def get_top_products(
    store_id: int,
    limit: int = Query(10, description="Number of top products to return"),
    period: str = Query("30d", description="Time period: 7d, 30d, all"),
    db: Session = Depends(get_db)
):
    interval_map = {"7d": "7 days", "30d": "30 days", "all": None}
    interval = interval_map.get(period, "30 days")

    date_filter = f"AND t.created_at >= NOW() - INTERVAL '{interval}'" if interval else ""

    rows = db.execute(
        text(f"""
            SELECT
                p.id            AS product_id,
                p.sku,
                p.name,
                p.category,
                SUM(ti.qty)     AS total_qty_sold,
                SUM(ti.qty * ti.unit_price - ti.discount) AS total_revenue
            FROM transaction_items ti
            JOIN transactions t  ON ti.transaction_id = t.id
            JOIN products p      ON ti.product_id = p.id
            WHERE t.store_id = :store_id
              AND t.status = 'completed'
              {date_filter}
            GROUP BY p.id, p.sku, p.name, p.category
            ORDER BY total_qty_sold DESC
            LIMIT :limit
        """),
        {"store_id": store_id, "limit": limit}
    ).fetchall()

    return {
        "store_id": store_id,
        "period": period,
        "top_products": [
            {
                "product_id": r.product_id,
                "sku": r.sku,
                "name": r.name,
                "category": r.category,
                "total_qty_sold": int(r.total_qty_sold),
                "total_revenue": round(float(r.total_revenue), 2),
            }
            for r in rows
        ]
    }


# ── GET /analytics/store-comparison ──────────────────────
# Cross-store revenue comparison (for Regional Admin dashboards)
@router.get("/store-comparison")
def store_comparison(
    period: str = Query("30d", description="Time period: 7d, 30d, all"),
    db: Session = Depends(get_db)
):
    interval_map = {"7d": "7 days", "30d": "30 days", "all": None}
    interval = interval_map.get(period, "30 days")
    date_filter = f"AND t.created_at >= NOW() - INTERVAL '{interval}'" if interval else ""

    rows = db.execute(
        text(f"""
            SELECT
                s.id            AS store_id,
                s.name          AS store_name,
                s.city,
                s.region,
                COALESCE(SUM(t.total_amount), 0) AS revenue,
                COUNT(t.id)                      AS tx_count
            FROM stores s
            LEFT JOIN transactions t
              ON t.store_id = s.id AND t.status = 'completed' {date_filter}
            WHERE s.is_active = TRUE
            GROUP BY s.id, s.name, s.city, s.region
            ORDER BY revenue DESC
        """)
    ).fetchall()

    return {
        "period": period,
        "stores": [
            {
                "store_id": r.store_id,
                "store_name": r.store_name,
                "city": r.city,
                "region": r.region,
                "revenue": float(r.revenue),
                "tx_count": r.tx_count,
            }
            for r in rows
        ]
    }


# ── GET /analytics/hourly-sales/{store_id} ───────────────
# Revenue & transaction count breakdown by hour (for today)
@router.get("/hourly-sales/{store_id}")
def hourly_sales(store_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT
                EXTRACT(HOUR FROM created_at)   AS hour,
                COUNT(*)                        AS tx_count,
                COALESCE(SUM(total_amount), 0)  AS revenue
            FROM transactions
            WHERE store_id = :store_id
              AND status = 'completed'
              AND created_at::date = CURRENT_DATE
            GROUP BY hour
            ORDER BY hour
        """),
        {"store_id": store_id}
    ).fetchall()

    return {
        "store_id": store_id,
        "date": "today",
        "hourly": [
            {
                "hour": int(r.hour),
                "tx_count": r.tx_count,
                "revenue": round(float(r.revenue), 2)
            }
            for r in rows
        ]
    }


# ── GET /analytics/inventory-health/{store_id} ───────────
# Stock health: low stock count, out-of-stock, and overstock
@router.get("/inventory-health/{store_id}")
def inventory_health(store_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text("""
            SELECT
                p.id, p.sku, p.name, p.category,
                i.quantity,
                p.reorder_level,
                CASE
                    WHEN i.quantity = 0              THEN 'out_of_stock'
                    WHEN i.quantity <= p.reorder_level THEN 'low_stock'
                    WHEN i.quantity > p.reorder_level * 5 THEN 'overstock'
                    ELSE 'healthy'
                END AS health_status
            FROM inventory i
            JOIN products p ON i.product_id = p.id
            WHERE i.store_id = :store_id
            ORDER BY i.quantity ASC
        """),
        {"store_id": store_id}
    ).fetchall()

    summary = {"out_of_stock": 0, "low_stock": 0, "healthy": 0, "overstock": 0}
    items = []
    for r in rows:
        summary[r.health_status] += 1
        items.append({
            "product_id": r.id,
            "sku": r.sku,
            "name": r.name,
            "category": r.category,
            "quantity": r.quantity,
            "reorder_level": r.reorder_level,
            "status": r.health_status,
        })

    return {
        "store_id": store_id,
        "summary": summary,
        "products": items
    }


# ── GET /analytics/daily-trend/{store_id} ────────────────
# Revenue trend for last N days (feeds line chart in dashboard)
@router.get("/daily-trend/{store_id}")
def daily_trend(
    store_id: int,
    days: int = Query(30, description="Number of past days to include"),
    db: Session = Depends(get_db)
):
    rows = db.execute(
        text("""
            SELECT
                DATE(created_at)        AS day,
                COUNT(*)                AS tx_count,
                SUM(total_amount)       AS revenue
            FROM transactions
            WHERE store_id = :store_id
              AND status = 'completed'
              AND created_at >= NOW() - INTERVAL '1 day' * :days
            GROUP BY day
            ORDER BY day ASC
        """),
        {"store_id": store_id, "days": days}
    ).fetchall()

    return {
        "store_id": store_id,
        "days": days,
        "trend": [
            {
                "day": str(r.day),
                "tx_count": r.tx_count,
                "revenue": round(float(r.revenue), 2)
            }
            for r in rows
        ]
    }


# ── GET /analytics/payment-split/{store_id} ──────────────
# Breakdown of sales by payment method (cash / card / upi)
@router.get("/payment-split/{store_id}")
def payment_split(
    store_id: int,
    period: str = Query("30d"),
    db: Session = Depends(get_db)
):
    interval_map = {"7d": "7 days", "30d": "30 days", "all": None}
    interval = interval_map.get(period, "30 days")
    date_filter = f"AND created_at >= NOW() - INTERVAL '{interval}'" if interval else ""

    rows = db.execute(
        text(f"""
            SELECT
                payment_method,
                COUNT(*)            AS tx_count,
                SUM(total_amount)   AS revenue
            FROM transactions
            WHERE store_id = :store_id
              AND status = 'completed'
              {date_filter}
            GROUP BY payment_method
            ORDER BY tx_count DESC
        """),
        {"store_id": store_id}
    ).fetchall()

    return {
        "store_id": store_id,
        "period": period,
        "payment_methods": [
            {
                "method": r.payment_method or "unknown",
                "tx_count": r.tx_count,
                "revenue": round(float(r.revenue), 2)
            }
            for r in rows
        ]
    }
