from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

connect_args: dict = {}
if "neon.tech" in settings.database_url or "sslmode=require" in settings.database_url:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.environment == "development",
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=5,
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
