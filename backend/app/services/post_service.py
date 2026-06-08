import asyncio
from uuid import UUID

from app.database import get_supabase
from app.services.ai_service import analyze_post
from app.services.comment_service import add_comments_to_post
from app.services.engagement_service import calculate_engagement, schedule_likes
from app.services.growth_service import check_milestones, get_user_level
from app.services.notification_service import notify_viral

FREE_DAILY_POST_LIMIT = 3
PREMIUM_DAILY_POST_LIMIT = 999


async def create_post(user_id: UUID, image_url: str, caption: str, location: str | None = None) -> dict:
    db = get_supabase()
    user = db.table("users").select("*").eq("id", str(user_id)).single().execute()
    if not user.data:
        raise ValueError("User not found")

    tier = user.data.get("tier_level", "free")
    limit = PREMIUM_DAILY_POST_LIMIT if tier == "premium" else FREE_DAILY_POST_LIMIT
    if user.data.get("daily_posts_used", 0) >= limit:
        raise ValueError("Daily post limit reached")

    analysis = await analyze_post(image_url, caption)
    engagement = calculate_engagement(
        float(analysis.quality_score),
        user.data.get("follower_count", 0),
        is_premium=(tier == "premium"),
    )

    post = db.table("posts").insert({
        "user_id": str(user_id),
        "image_url": image_url,
        "caption": caption,
        "quality_score": float(analysis.quality_score),
        "content_type": analysis.content_type,
        "keywords": analysis.keywords,
        "engagement_prediction": analysis.engagement_prediction,
        "location": location,
        "is_viral": engagement["is_viral"],
        "target_like_count": engagement["target_likes"],
        "follower_gain": engagement["follower_gain"],
    }).execute()

    post_data = post.data[0]
    post_id = UUID(post_data["id"])

    await schedule_likes(post_id, engagement["target_likes"])

    asyncio.create_task(
        add_comments_to_post(
            post_id=post_id,
            image_url=image_url,
            caption=caption,
            content_type=analysis.content_type,
            quality_score=float(analysis.quality_score),
            comment_hints=analysis.comment_hints,
        )
    )

    new_followers = (user.data.get("follower_count") or 0) + engagement["follower_gain"]
    new_post_count = (user.data.get("post_count") or 0) + 1
    new_likes_total = (user.data.get("total_likes_received") or 0) + engagement["target_likes"]

    db.table("users").update({
        "follower_count": new_followers,
        "post_count": new_post_count,
        "total_likes_received": new_likes_total,
        "daily_posts_used": user.data.get("daily_posts_used", 0) + 1,
        "level": get_user_level(new_followers),
        "last_active": "now()",
    }).eq("id", str(user_id)).execute()

    await check_milestones(user_id, new_followers, new_likes_total, new_post_count)

    if engagement["is_viral"]:
        await notify_viral(str(user_id), post_data["id"])

    return {
        **post_data,
        "target_like_count": engagement["target_likes"],
        "follower_gain": engagement["follower_gain"],
        "new_follower_count": new_followers,
        "analysis": {
            "quality_score": float(analysis.quality_score),
            "content_type": analysis.content_type,
            "keywords": analysis.keywords,
            "engagement_prediction": analysis.engagement_prediction,
        },
    }
