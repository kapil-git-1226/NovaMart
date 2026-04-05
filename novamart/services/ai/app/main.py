from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers.ai import router as ai_router

app = FastAPI(
    title="NovaMart AI Service",
    description="Intelligent natural language search and analytics using Gemini 1.5 Flash.",
    version="1.0.0",
    docs_url="/ai/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

Instrumentator().instrument(app).expose(app)
app.include_router(ai_router, prefix="/ai", tags=["AI"])

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "ai", "version": "1.0.0"}
