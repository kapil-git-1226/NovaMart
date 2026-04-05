from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.inventory import router as inventory_router

app = FastAPI(
    title="NovaMart Inventory Service",
    description="Manages product catalog, per-store stock levels, and replenishment alerts.",
    version="1.0.0",
    docs_url="/inventory/docs",
    redoc_url="/inventory/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Instrumentator().instrument(app).expose(app)
app.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "inventory", "version": "1.0.0"}
