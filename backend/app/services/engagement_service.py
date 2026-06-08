"""Beğeni, yorum ve engagement hesaplama."""
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from app.database import get_supabase

DRIP_WINDOWS = [(0, 5, 0.10), (5, 30, 0.40), (30, 60, 0.30), (60, 1440, 0.20)]


def calculate_engagement(quality_score: float, follower_count: int, is_premium: bool = False) -> dict:
    """Skora göre beğeni ve takipçi kazancı hesapla."""
    fc = max(follower_count, 10)

    if quality_score >= 9:
        like_ratio = random.uniform(0.15, 0.25)
        follower_gain = random.randint(200, 500)
    elif quality_score >= 7:
        like_ratio = random.uniform(0.08, 0.15)
        follower_gain = random.randint(50, 200)
    elif quality_score >= 5:
        like_ratio = random.uniform(0.03, 0.08)
        follower_gain = random.randint(10, 50)
    else:
        like_ratio = random.uniform(0.01, 0.03)
        follower_gain = random.randint(2, 10)

    target_likes = max(5, int(fc * like_ratio))
    is_viral = False

    if quality_score >= 8.5 and random.random() < 0.20:
        is_viral = True
        target_likes *= 10

    if is_premium:
        target_likes = int(target_likes * 1.5)
        follower_gain *= 2

    return {
        "target_likes": target_likes,
        "follower_gain": follower_gain,
        "is_viral": is_viral,
    }


async def schedule_likes(post_id: UUID, target_count: int) -> None:
    db = get_supabase()
    users = (
        db.table("fake_users")
        .select("id")
        .gte("tier", 2)
        .limit(target_count * 2)
        .execute()
    )
    fake_ids = [u["id"] for u in (users.data or [])]
    if not fake_ids:
        return

    random.shuffle(fake_ids)
    post_created = datetime.now(timezone.utc)
    scheduled = []

    for w_start, w_end, pct in DRIP_WINDOWS:
        window_likes = int(target_count * pct)
        duration = (w_end - w_start) * 60
        for _ in range(window_likes):
            if not fake_ids:
                break
            fid = fake_ids.pop()
            offset = w_start * 60 + random.randint(0, max(1, duration))
            scheduled.append({
                "post_id": str(post_id),
                "fake_user_id": fid,
                "scheduled_at": (post_created + timedelta(seconds=offset)).isoformat(),
            })

    if scheduled:
        db.table("scheduled_likes").insert(scheduled).execute()


async def deliver_pending_likes() -> int:
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

    count = 0
    for item in pending.data or []:
        try:
            db.table("likes").insert({
                "post_id": item["post_id"],
                "fake_user_id": item["fake_user_id"],
            }).execute()
            db.table("scheduled_likes").update({"delivered": True}).eq("id", item["id"]).execute()
            post = item.get("posts") or {}
            new_count = (post.get("like_count") or 0) + 1
            db.table("posts").update({"like_count": new_count}).eq("id", item["post_id"]).execute()
            count += 1
        except Exception:
            db.table("scheduled_likes").update({"delivered": True}).eq("id", item["id"]).execute()
    return count
