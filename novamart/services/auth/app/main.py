from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.auth import router as auth_router

app = FastAPI(
    title="NovaMart Auth Service",
    description="Handles user registration, login, JWT tokens, and RBAC.",
    version="1.0.0",
    docs_url="/auth/docs",       # Swagger UI at http://localhost:8001/auth/docs
    redoc_url="/auth/redoc"
)

# Allow the React frontend to talk to this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Expose /metrics for Prometheus monitoring
Instrumentator().instrument(app).expose(app)

# Register auth routes under /auth prefix
app.include_router(auth_router, prefix="/auth", tags=["Auth"])


@app.get("/health", tags=["Health"])
async def health():
    """Quick check to confirm the service is alive."""
    return {"status": "ok", "service": "auth", "version": "1.0.0"}
