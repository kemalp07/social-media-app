"""One-off growth diagnostics — python -m scripts.test_growth"""
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Post, User
from app.services.growth_service import calculate_growth_amount, passive_growth


async def main():
    print("ENVIRONMENT:", settings.environment)
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM follows"))
            print("follows table count:", result.scalar())
        except Exception as exc:
            print("follows table ERROR:", exc)

        users = (await session.execute(select(User))).scalars().all()
        print("users:", len(users))

        now = datetime.now(timezone.utc)
        for user in users[:5]:
            posts = (
                await session.execute(select(Post).where(Post.user_id == user.id))
            ).scalars().all()
            amount = await calculate_growth_amount(session, user)
            print(
                f"user={user.username} followers={user.follower_count} "
                f"posts={len(posts)} growth_amount={amount}"
            )
            for post in posts:
                created_at = post.created_at
                if created_at and created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                passes = created_at >= now - timedelta(days=7) if created_at else False
                print(f"  post created_at={post.created_at} recent_7d={passes}")

        try:
            total = await passive_growth(session)
            await session.commit()
            print("passive_growth OK, total:", total)
        except Exception as exc:
            print("passive_growth ERROR:", type(exc).__name__, exc)
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(main())
