import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from app.database import get_supabase


def calculate_target_likes(quality_score: Decimal, follower_count: int, is_premium: bool = False) -> int:
    """quality_score × follower_ratio = total likes"""
    ratio = max(0.01, follower_count / 1000)
    base = float(quality_score) * ratio * 100
    if is_premium:
        base *= 2
    return max(5, int(base))


def check_viral_trigger(quality_score: Decimal, is_premium: bool = False) -> bool:
    """Score 8+ → 20% viral chance (premium: 30%)."""
    if float(quality_score) < 8:
        return False
    chance = 0.30 if is_premium else 0.20
    return random.random() < chance


def apply_viral_multiplier(target_likes: int) -> int:
    return target_likes * 10


def calculate_follower_gain(quality_score: Decimal, is_premium: bool = False) -> int:
    score = float(quality_score)
    if score >= 9:
        gain = random.randint(500, 2000)
    elif score >= 7:
        gain = random.randint(100, 500)
    elif score >= 5:
        gain = random.randint(20, 100)
    else:
        gain = random.randint(5, 20)
    if is_premium:
        gain *= 2
    return gain


# Drip schedule: 10% / 40% / 30% / 20%
DRIP_WINDOWS = [
    (0, 5, 0.10),
    (5, 30, 0.40),
    (30, 60, 0.30),
    (60, 1440, 0.20),
]


async def schedule_likes(post_id: UUID, target_count: int, tier_filter: int = 3) -> None:
    """Schedule likes across time windows using Tier 2+3 fake users."""
    db = get_supabase()

    users = (
        db.table("fake_users")
        .select("id")
        .gte("tier", tier_filter)
        .limit(target_count * 2)
        .execute()
    )
    fake_user_ids = [u["id"] for u in users.data]
    if not fake_user_ids:
        return

    random.shuffle(fake_user_ids)
    post_created = datetime.now(timezone.utc)
    scheduled = []

    for window_start, window_end, pct in DRIP_WINDOWS:
        window_likes = int(target_count * pct)
        window_duration = (window_end - window_start) * 60  # minutes to seconds

        for i in range(window_likes):
            if not fake_user_ids:
                break
            fake_user_id = fake_user_ids.pop()
            offset_seconds = window_start * 60 + random.randint(0, max(1, window_duration))
            scheduled_at = post_created + timedelta(seconds=offset_seconds)
            scheduled.append({
                "post_id": str(post_id),
                "fake_user_id": fake_user_id,
                "scheduled_at": scheduled_at.isoformat(),
            })

    if scheduled:
        db.table("scheduled_likes").insert(scheduled).execute()


async def deliver_pending_likes() -> int:
    """Cron job: deliver likes whose scheduled_at has passed."""
    db = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    pending = (
        db.table("scheduled_likes")
        .select("*, posts(user_id, like_count)")
        .eq("delivered", False)
        .lte("scheduled_at", now)
        .limit(100)
        .execute()
    )

    delivered_count = 0
    for item in pending.data or []:
        try:
            db.table("likes").insert({
                "post_id": item["post_id"],
                "fake_user_id": item["fake_user_id"],
            }).execute()

            db.table("scheduled_likes").update({"delivered": True}).eq("id", item["id"]).execute()

            post = item.get("posts") or {}
            new_count = (post.get("like_count") or 0) + 1
            db.table("posts").update({
                "like_count": new_count,
                "likes_delivered": new_count,
            }).eq("id", item["post_id"]).execute()

            delivered_count += 1
        except Exception:
            db.table("scheduled_likes").update({"delivered": True}).eq("id", item["id"]).execute()

    return delivered_count
