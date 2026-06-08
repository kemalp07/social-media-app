from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import fake_users, feed, messages, notifications, posts, users
from app.scheduler import setup_scheduler

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_scheduler()
    yield


app = FastAPI(
    title="Vibe API",
    description="Social media simulator — Neon PostgreSQL + Vertex AI",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(users.router, prefix="/api")
app.include_router(feed.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(fake_users.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "db": "neon", "ai": "vertex"}
