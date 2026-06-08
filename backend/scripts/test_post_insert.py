import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, text
from app.database import AsyncSessionLocal
from app.models import Post, User


async def test_insert():
    async with AsyncSessionLocal() as s:
        user = (await s.execute(select(User).limit(1))).scalar_one_or_none()
        if not user:
            print("No user in DB")
            return
        post = Post(
            user_id=user.id,
            image_url="/uploads/test.jpg",
            caption="test",
            quality_score=7.0,
            on_explore=True,
            explore_at=datetime.now(timezone.utc),
        )
        s.add(post)
        try:
            await s.flush()
            print("aware explore_at: OK", post.id)
            await s.rollback()
        except Exception as e:
            print("aware explore_at FAILED:", type(e).__name__, e)
            await s.rollback()

        post2 = Post(
            user_id=user.id,
            image_url="/uploads/test2.jpg",
            caption="test",
            quality_score=7.0,
            on_explore=True,
            explore_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        s.add(post2)
        try:
            await s.flush()
            print("naive explore_at: OK", post2.id)
            await s.rollback()
        except Exception as e:
            print("naive explore_at FAILED:", type(e).__name__, e)
            await s.rollback()


if __name__ == "__main__":
    asyncio.run(test_insert())
