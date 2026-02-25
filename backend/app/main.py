from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chart, models, data_refresh, history, gemini
from app.models.database import init_db

app = FastAPI(
    title="Copilot Model Navigator API",
    description="GitHub Copilot モデル推薦システム",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


app.include_router(chart.router, prefix="/api/v1")
app.include_router(models.router, prefix="/api/v1")
app.include_router(data_refresh.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(gemini.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
