import asyncio
import logging
from decimal import Decimal
from uuid import UUID

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models import Post, User
from app.serializers import post_to_dict
from app.services.ai_service import analyze_post
from app.services.comment_service import add_comments_to_post
from app.services.engagement_service import calculate_engagement, schedule_likes
from app.services.engagement_rates import qualifies_for_explore
from app.services.growth_service import check_milestones, get_user_level, _utc_now
from app.services.notification_service import notify_explore, notify_viral

logger = logging.getLogger(__name__)

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


async def _enrich_post_after_upload(
    post_id: UUID,
    user_id: UUID,
    image_bytes: bytes,
    caption: str,
    mime_type: str,
) -> None:
    """AI analizi, beğeni planı ve engagement — upload yanıtını bekletmez."""
    # Commit tamamlanana kadar kısa bekle (create_task erken koşarsa)
    for attempt in range(8):
        async with AsyncSessionLocal() as session:
            try:
                post_result = await session.execute(select(Post).where(Post.id == post_id))
                post = post_result.scalar_one_or_none()
                if not post:
                    await session.rollback()
                    await asyncio.sleep(0.2 * (attempt + 1))
                    continue

                user_result = await session.execute(select(User).where(User.id == user_id))
                user = user_result.scalar_one_or_none()
                if not user:
                    await session.rollback()
                    logger.error("Post enrichment aborted: user %s not found", user_id)
                    return

                analysis = await analyze_post(image_bytes, caption, mime_type)
                engagement = calculate_engagement(
                    float(analysis.quality_score),
                    user.follower_count or 0,
                    is_premium=(user.tier_level == "premium"),
                )
                quality = float(analysis.quality_score)
                featured_on_explore = qualifies_for_explore(quality, analysis.engagement_prediction)

                post.quality_score = quality
                post.content_type = analysis.content_type
                post.keywords = analysis.keywords
                post.engagement_prediction = analysis.engagement_prediction
                post.is_viral = engagement["is_viral"]
                post.on_explore = featured_on_explore
                post.explore_at = _utc_now() if featured_on_explore else None
                post.target_like_count = engagement["target_likes"]
                post.follower_gain = engagement["follower_gain"]

                await schedule_likes(session, post.id, engagement["target_likes"])

                user.follower_count = (user.follower_count or 0) + engagement["follower_gain"]
                user.level = get_user_level(user.follower_count)

                await check_milestones(
                    session,
                    user_id,
                    user.follower_count,
                    user.total_likes_received or 0,
                    user.post_count or 0,
                )

                if engagement["is_viral"]:
                    await notify_viral(session, user_id, post.id)
                if featured_on_explore:
                    await notify_explore(session, user_id, post.id)

                await session.commit()
                logger.info(
                    "Post %s enriched: quality=%.1f viral=%s likes=%d followers+%d",
                    post_id,
                    quality,
                    engagement["is_viral"],
                    engagement["target_likes"],
                    engagement["follower_gain"],
                )

                asyncio.create_task(_run_comments_background(
                    post.id,
                    image_bytes,
                    caption,
                    analysis.content_type,
                    quality,
                    analysis.comment_hints,
                    mime_type,
                ))
                return
            except Exception:
                await session.rollback()
                logger.exception("Post enrichment failed for %s (attempt %d)", post_id, attempt + 1)
                await asyncio.sleep(0.5 * (attempt + 1))

    logger.error("Post enrichment gave up: post %s not found after retries", post_id)


async def create_post(
    session: AsyncSession,
    user_id: UUID,
    image_url: str,
    image_bytes: bytes,
    caption: str,
    location: str | None = None,
    mime_type: str = "image/jpeg",
    background_tasks: BackgroundTasks | None = None,
) -> dict:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    limit = PREMIUM_DAILY_POST_LIMIT if user.tier_level == "premium" else FREE_DAILY_POST_LIMIT
    if (user.daily_posts_used or 0) >= limit:
        raise ValueError("Daily post limit reached")

    post = Post(
        user_id=user_id,
        image_url=image_url,
        caption=caption,
        quality_score=Decimal("5.0"),
        content_type="other",
        keywords=[],
        engagement_prediction="medium",
        location=location,
        is_viral=False,
        on_explore=False,
        explore_at=None,
        target_like_count=0,
        follower_gain=0,
    )
    session.add(post)
    await session.flush()

    user.post_count = (user.post_count or 0) + 1
    user.daily_posts_used = (user.daily_posts_used or 0) + 1
    user.last_active = _utc_now()

    enrich_args = (post.id, user_id, image_bytes, caption, mime_type)
    if background_tasks is not None:
        # Yanıt + DB commit sonrası çalışır — viral/beğeni boost burada uygulanır
        background_tasks.add_task(_enrich_post_after_upload, *enrich_args)
    else:
        asyncio.create_task(_enrich_post_after_upload(*enrich_args))

    data = post_to_dict(post, include_user=False)
    data["users"] = {
        "username": user.username,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
    }
    return {
        **data,
        "on_explore": False,
        "target_like_count": 0,
        "follower_gain": 0,
        "new_follower_count": user.follower_count,
    }
