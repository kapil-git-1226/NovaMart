from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.sales import router as sales_router

app = FastAPI(
    title="NovaMart Sales Service",
    description="Handles POS billing, transaction history, receipts, and returns.",
    version="1.0.0",
    docs_url="/sales/docs",
    redoc_url="/sales/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Instrumentator().instrument(app).expose(app)
app.include_router(sales_router, prefix="/sales", tags=["Sales"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "sales", "version": "1.0.0"}
