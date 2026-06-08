from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import FakePost, Post
from app.serializers import fake_user_to_dict, post_to_dict
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/{user_id}")
async def get_feed(user_id: UUID, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    user_posts_result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    fake_posts_result = await db.execute(
        select(FakePost)
        .options(selectinload(FakePost.fake_user))
        .order_by(FakePost.created_at.desc())
        .limit(limit)
    )

    feed = []
    for p in user_posts_result.scalars().all():
        feed.append({**post_to_dict(p, include_user=True), "is_own": True, "feed_type": "user"})

    for p in fake_posts_result.scalars().all():
        bot = fake_user_to_dict(p.fake_user) if p.fake_user else {}
        feed.append({
            "id": p.id,
            "image_url": p.image_url,
            "caption": p.caption or "",
            "like_count": p.like_count,
            "comment_count": 0,
            "created_at": p.created_at,
            "is_own": False,
            "feed_type": "fake",
            "users": {
                "username": bot.get("username"),
                "display_name": bot.get("display_name"),
                "avatar_url": bot.get("avatar_url") or dicebear_url(bot.get("avatar_seed", "")),
                "is_verified": bot.get("is_verified", False),
            },
        })

    feed.sort(key=lambda x: x["created_at"], reverse=True)
    return feed[:limit]
