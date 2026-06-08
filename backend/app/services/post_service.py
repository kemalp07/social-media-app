import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models import Post, User
from app.serializers import post_to_dict
from app.services.ai_service import analyze_post
from app.services.comment_service import add_comments_to_post
from app.services.engagement_service import calculate_engagement, schedule_likes
from app.services.growth_service import check_milestones, get_user_level
from app.services.notification_service import notify_viral

FREE_DAILY_POST_LIMIT = 3
PREMIUM_DAILY_POST_LIMIT = 999


async def _run_comments_background(
    post_id: UUID,
    image_bytes: bytes,
    caption: str,
    content_type: str,
    quality_score: float,
    comment_hints: list[str] | None,
    mime_type: str,
) -> None:
    async with AsyncSessionLocal() as session:
        try:
            await add_comments_to_post(
                session, post_id, image_bytes, caption, content_type,
                quality_score, comment_hints, mime_type,
            )
            await session.commit()
        except Exception:
            await session.rollback()


async def create_post(
    session: AsyncSession,
    user_id: UUID,
    image_url: str,
    image_bytes: bytes,
    caption: str,
    location: str | None = None,
    mime_type: str = "image/jpeg",
) -> dict:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    limit = PREMIUM_DAILY_POST_LIMIT if user.tier_level == "premium" else FREE_DAILY_POST_LIMIT
    if (user.daily_posts_used or 0) >= limit:
        raise ValueError("Daily post limit reached")

    analysis = await analyze_post(image_bytes, caption, mime_type)
    engagement = calculate_engagement(
        float(analysis.quality_score),
        user.follower_count or 0,
        is_premium=(user.tier_level == "premium"),
    )

    post = Post(
        user_id=user_id,
        image_url=image_url,
        caption=caption,
        quality_score=float(analysis.quality_score),
        content_type=analysis.content_type,
        keywords=analysis.keywords,
        engagement_prediction=analysis.engagement_prediction,
        location=location,
        is_viral=engagement["is_viral"],
        target_like_count=engagement["target_likes"],
        follower_gain=engagement["follower_gain"],
    )
    session.add(post)
    await session.flush()

    await schedule_likes(session, post.id, engagement["target_likes"])

    asyncio.create_task(_run_comments_background(
        post.id, image_bytes, caption, analysis.content_type,
        float(analysis.quality_score), analysis.comment_hints, mime_type,
    ))

    user.follower_count = (user.follower_count or 0) + engagement["follower_gain"]
    user.post_count = (user.post_count or 0) + 1
    user.total_likes_received = (user.total_likes_received or 0) + engagement["target_likes"]
    user.daily_posts_used = (user.daily_posts_used or 0) + 1
    user.level = get_user_level(user.follower_count)
    from datetime import datetime, timezone
    user.last_active = datetime.now(timezone.utc)

    await check_milestones(session, user_id, user.follower_count, user.total_likes_received, user.post_count)

    if engagement["is_viral"]:
        await notify_viral(session, user_id, post.id)

    data = post_to_dict(post)
    return {
        **data,
        "target_like_count": engagement["target_likes"],
        "follower_gain": engagement["follower_gain"],
        "new_follower_count": user.follower_count,
        "analysis": {
            "quality_score": float(analysis.quality_score),
            "content_type": analysis.content_type,
            "keywords": analysis.keywords,
            "engagement_prediction": analysis.engagement_prediction,
        },
    }
