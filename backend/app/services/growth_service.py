"""Organik takipçi büyümesi, milestone ve günlük görevler."""
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FakePost, FakeUser, FollowerGrowthLog, Milestone, Post, User
from app.services.notification_service import create_notification, send_push

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

LEVEL_THRESHOLDS = [(1_000_000, "mega"), (100_000, "star"), (10_000, "rising"), (1_000, "micro"), (0, "beginner")]

STOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
]

STOCK_CAPTIONS = ["Bugün harika bir gün ☀️", "Kahve molası ☕", "Yeni bir macera 🌍", "Antrenman bitti 💪", "Akşam manzarası 🌅", "Hafta sonu modu 😎"]


def get_user_level(follower_count: int) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if follower_count >= threshold:
            return level
    return "beginner"


async def organic_growth(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    result = await session.execute(select(User))
    users = result.scalars().all()
    total = 0

    for user in users:
        gain = random.randint(2, 8)
        if user.last_active:
            la = user.last_active.replace(tzinfo=timezone.utc) if user.last_active.tzinfo is None else user.last_active
            if (now - la).days > 7:
                gain = max(1, gain // 2)

        viral_result = await session.execute(
            select(Post.id)
            .where(Post.user_id == user.id, Post.is_viral == True, Post.created_at >= now - timedelta(hours=48))
            .limit(1)
        )
        if viral_result.scalar_one_or_none():
            gain += random.randint(50, 200)

        user.follower_count = (user.follower_count or 0) + gain
        user.level = get_user_level(user.follower_count)
        user.last_active = now
        session.add(FollowerGrowthLog(user_id=user.id, amount=gain, reason="organic"))
        await check_milestones(session, user.id, follower_count=user.follower_count)
        total += gain

    return total


async def daily_fake_posts(session: AsyncSession) -> int:
    result = await session.execute(select(FakeUser.id).where(FakeUser.tier <= 2).limit(50))
    bots = result.scalars().all()
    for bot_id in bots[:20]:
        session.add(FakePost(
            fake_user_id=bot_id,
            image_url=random.choice(STOCK_PHOTOS),
            caption=random.choice(STOCK_CAPTIONS),
            like_count=random.randint(100, 50000),
        ))
    return min(len(bots), 20)


async def check_milestones(
    session: AsyncSession,
    user_id: UUID,
    follower_count: int = 0,
    total_likes: int = 0,
    post_count: int = 0,
) -> list[str]:
    if not follower_count:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            follower_count = user.follower_count
            total_likes = user.total_likes_received
            post_count = user.post_count

    new_milestones = []
    checks = [(FOLLOWER_MILESTONES, follower_count), (LIKE_MILESTONES, total_likes), (POST_MILESTONES, post_count)]

    for milestones, value in checks:
        for threshold, mtype, message in milestones:
            if value >= threshold:
                existing = await session.execute(
                    select(Milestone.id).where(Milestone.user_id == user_id, Milestone.type == mtype)
                )
                if not existing.scalar_one_or_none():
                    session.add(Milestone(user_id=user_id, type=mtype, reward=message))
                    await create_notification(session, user_id, "milestone", message)
                    await send_push(session, user_id, "Milestone! 🎉", message)
                    new_milestones.append(message)

    return new_milestones
