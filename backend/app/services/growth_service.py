"""Organik takipçi büyümesi, milestone ve günlük görevler."""
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from app.database import get_supabase

FOLLOWER_MILESTONES = [
    (100, "followers_100", "İlk yüzünü kırdın! 🎉 Yolculuk başlıyor..."),
    (1_000, "followers_1k", "Micro influencer oldun! 👏 1000 kişi seni takip ediyor"),
    (10_000, "followers_10k", "10 bin! Sponsorlar yakında gelecek 🔥"),
    (100_000, "followers_100k", "SEN ARTIK GERÇEK BİR İSİMSİN 👑"),
    (500_000, "followers_500k", "Yarım milyon! İnanılmazsın 🚀"),
    (1_000_000, "followers_1m", "MİLYON TAKİPÇİ! 🚀🚀🚀"),
]

LIKE_MILESTONES = [
    (1_000, "likes_1k", "1K beğeni! Trend başlıyor"),
    (10_000, "likes_10k", "10K beğeni! Trending!"),
    (100_000, "likes_100k", "100K beğeni! Viral oldun! 🔥"),
]

POST_MILESTONES = [
    (10, "posts_10", "10 gönderi! İstikrarlısın 📸"),
    (50, "posts_50", "50 gönderi! Profesyonel içerik üreticisi"),
    (100, "posts_100", "100 gönderi! Efsane!"),
]

LEVEL_THRESHOLDS = [
    (1_000_000, "mega"),
    (100_000, "star"),
    (10_000, "rising"),
    (1_000, "micro"),
    (0, "beginner"),
]

STOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
]

STOCK_CAPTIONS = [
    "Bugün harika bir gün ☀️",
    "Kahve molası ☕",
    "Yeni bir macera 🌍",
    "Antrenman bitti 💪",
    "Akşam manzarası 🌅",
    "Hafta sonu modu 😎",
]


def get_user_level(follower_count: int) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if follower_count >= threshold:
            return level
    return "beginner"


async def organic_growth() -> int:
    """Saatlik organik büyüme."""
    db = get_supabase()
    now = datetime.now(timezone.utc)
    users = db.table("users").select("id, follower_count, last_active, post_count").execute()
    total = 0

    for user in users.data or []:
        gain = random.randint(2, 8)

        last_active = user.get("last_active")
        if last_active:
            try:
                la = datetime.fromisoformat(last_active.replace("Z", "+00:00"))
                if (now - la).days > 7:
                    gain = max(1, gain // 2)
            except ValueError:
                pass

        viral = (
            db.table("posts")
            .select("id")
            .eq("user_id", user["id"])
            .eq("is_viral", True)
            .gte("created_at", (now - timedelta(hours=48)).isoformat())
            .execute()
        )
        if viral.data:
            gain += random.randint(50, 200)

        new_count = (user["follower_count"] or 0) + gain
        level = get_user_level(new_count)

        db.table("users").update({
            "follower_count": new_count,
            "level": level,
            "last_active": now.isoformat(),
        }).eq("id", user["id"]).execute()

        db.table("follower_growth_log").insert({
            "user_id": user["id"],
            "amount": gain,
            "reason": "organic",
        }).execute()

        await check_milestones(UUID(user["id"]), follower_count=new_count)
        total += gain

    return total


async def daily_fake_posts() -> int:
    """Tier 1/2 fake user'lar feed'e post atar."""
    db = get_supabase()
    bots = (
        db.table("fake_users")
        .select("id")
        .lte("tier", 2)
        .limit(50)
        .execute()
    )
    count = 0
    for bot in (bots.data or [])[:20]:
        db.table("fake_posts").insert({
            "fake_user_id": bot["id"],
            "image_url": random.choice(STOCK_PHOTOS),
            "caption": random.choice(STOCK_CAPTIONS),
            "like_count": random.randint(100, 50000),
        }).execute()
        count += 1
    return count


async def check_milestones(
    user_id: UUID,
    follower_count: int = 0,
    total_likes: int = 0,
    post_count: int = 0,
) -> list[str]:
    from app.services.notification_service import create_notification, send_push

    db = get_supabase()
    new_milestones = []

    if not follower_count:
        u = db.table("users").select("follower_count, total_likes_received, post_count").eq("id", str(user_id)).single().execute()
        if u.data:
            follower_count = u.data.get("follower_count", 0)
            total_likes = u.data.get("total_likes_received", 0)
            post_count = u.data.get("post_count", 0)

    checks = [
        (FOLLOWER_MILESTONES, follower_count),
        (LIKE_MILESTONES, total_likes),
        (POST_MILESTONES, post_count),
    ]

    for milestones, value in checks:
        for threshold, mtype, message in milestones:
            if value >= threshold:
                existing = (
                    db.table("milestones")
                    .select("id")
                    .eq("user_id", str(user_id))
                    .eq("type", mtype)
                    .execute()
                )
                if not existing.data:
                    db.table("milestones").insert({
                        "user_id": str(user_id),
                        "type": mtype,
                        "reward": message,
                    }).execute()
                    await create_notification(str(user_id), "milestone", message)
                    await send_push(str(user_id), "Milestone! 🎉", message)
                    new_milestones.append(message)

    return new_milestones
