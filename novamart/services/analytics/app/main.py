from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.analytics import router as analytics_router

app = FastAPI(
    title="NovaMart Analytics Service",
    description="Store KPIs, revenue trends, top products, inventory health, and cross-store comparisons.",
    version="1.0.0",
    docs_url="/analytics/docs",
    redoc_url="/analytics/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Instrumentator().instrument(app).expose(app)
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "analytics", "version": "1.0.0"}
