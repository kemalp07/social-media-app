import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.database import get_supabase

MILESTONE_THRESHOLDS = [
    (100, "followers_100", "İlk yüzün! 🎉"),
    (1_000, "followers_1k", "Micro influencer oldun!"),
    (10_000, "followers_10k", "Sponsorlar geliyor..."),
    (100_000, "followers_100k", "Sen artık ünlüsün 👑"),
    (1_000_000, "followers_1m", "Mega star! 🚀"),
]

LIKE_MILESTONES = [
    (1_000, "likes_1k", "1K beğeni!"),
    (10_000, "likes_10k", "Trending!"),
    (100_000, "likes_100k", "Viral oldun! 🔥"),
]


async def apply_post_follower_gain(user_id: UUID, gain: int, reason: str = "post_quality") -> int:
    db = get_supabase()
    user = db.table("users").select("follower_count, tier_level").eq("id", str(user_id)).single().execute()
    new_count = (user.data["follower_count"] or 0) + gain

    db.table("users").update({"follower_count": new_count}).eq("id", str(user_id)).execute()
    db.table("follower_growth_log").insert({
        "user_id": str(user_id),
        "amount": gain,
        "reason": reason,
    }).execute()

    await check_follower_milestones(user_id, new_count)
    return new_count


async def passive_follower_growth() -> int:
    """Hourly cron: +2-8 followers per user (premium 2x). Viral posts boost."""
    db = get_supabase()
    users = db.table("users").select("id, follower_count, tier_level, last_active, post_count").execute()

    total_gained = 0
    now = datetime.now(timezone.utc)

    for user in users.data or []:
        base_gain = random.randint(2, 8)
        if user.get("tier_level") == "premium":
            base_gain *= 2

        # Slow down if inactive (no post in 7+ days)
        last_active = user.get("last_active")
        if last_active:
            try:
                la = datetime.fromisoformat(last_active.replace("Z", "+00:00"))
                if (now - la).days > 7:
                    base_gain = max(1, base_gain // 3)
            except ValueError:
                pass

        # Viral post boost: check recent viral posts
        viral_posts = (
            db.table("posts")
            .select("id, created_at")
            .eq("user_id", user["id"])
            .eq("is_viral", True)
            .gte("created_at", (now - timedelta(days=3)).isoformat())
            .execute()
        )
        if viral_posts.data:
            base_gain += random.randint(100, 500)

        new_count = (user["follower_count"] or 0) + base_gain
        db.table("users").update({
            "follower_count": new_count,
            "last_active": now.isoformat(),
        }).eq("id", user["id"]).execute()

        db.table("follower_growth_log").insert({
            "user_id": user["id"],
            "amount": base_gain,
            "reason": "passive" if not viral_posts.data else "viral",
        }).execute()

        await check_follower_milestones(UUID(user["id"]), new_count)
        total_gained += base_gain

    return total_gained


async def check_follower_milestones(user_id: UUID, follower_count: int) -> None:
    from app.services.notification_service import create_notification, send_push

    db = get_supabase()
    for threshold, milestone_type, message in MILESTONE_THRESHOLDS:
        if follower_count >= threshold:
            existing = (
                db.table("milestones")
                .select("id")
                .eq("user_id", str(user_id))
                .eq("type", milestone_type)
                .execute()
            )
            if not existing.data:
                db.table("milestones").insert({
                    "user_id": str(user_id),
                    "type": milestone_type,
                    "reward": message,
                }).execute()
                await create_notification(str(user_id), "milestone", message)
                await send_push(str(user_id), "Milestone!", message)

                if threshold == 10_000:
                    await create_notification(str(user_id), "sponsor_offer", "Bir marka seninle çalışmak istiyor! 📧")
                if threshold == 100_000:
                    await create_notification(str(user_id), "media", "Haber sitelerinde adın geçiyor! 📰")


async def check_like_milestones(user_id: UUID, total_likes: int) -> None:
    from app.services.notification_service import create_notification, send_push

    db = get_supabase()
    for threshold, milestone_type, message in LIKE_MILESTONES:
        if total_likes >= threshold:
            existing = (
                db.table("milestones")
                .select("id")
                .eq("user_id", str(user_id))
                .eq("type", milestone_type)
                .execute()
            )
            if not existing.data:
                db.table("milestones").insert({
                    "user_id": str(user_id),
                    "type": milestone_type,
                    "reward": message,
                }).execute()
                await create_notification(str(user_id), "milestone", message)
                await send_push(str(user_id), "Milestone!", message)
