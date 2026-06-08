"""Organik takipçi büyümesi, milestone ve günlük görevler."""
import logging
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import FakePost, FakeUser, Follow, FollowerGrowthLog, Milestone, Post, User
from app.services.notification_service import create_notification, notify_follower_growth, send_push

logger = logging.getLogger(__name__)

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


def _utc_now() -> datetime:
    """Naive UTC — Neon TIMESTAMP WITHOUT TIME ZONE kolonlarıyla uyumlu."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_user_level(follower_count: int) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if follower_count >= threshold:
            return level
    return "beginner"


def _split_growth_tiers(amount: int) -> tuple[int, int, int]:
    if amount <= 0:
        return 0, 0, 0
    if amount == 1:
        return 1, 0, 0
    if amount == 2:
        return 1, 1, 0

    tier1_count = max(1, int(amount * 0.05))
    tier2_count = max(1, int(amount * 0.10))
    tier3_count = max(0, amount - tier1_count - tier2_count)

    while tier1_count + tier2_count + tier3_count > amount:
        if tier3_count > 0:
            tier3_count -= 1
        elif tier2_count > 1:
            tier2_count -= 1
        else:
            tier1_count -= 1

    return tier1_count, tier2_count, tier3_count


async def calculate_growth_amount(session: AsyncSession, user: User) -> int:
    """Saniyelik tick: 0 veya 1 takipçi (drip growth)."""
    now = _utc_now()

    if settings.environment == "development":
        return 1

    recent_post = await session.execute(
        select(Post.id)
        .where(Post.user_id == user.id, Post.created_at >= now - timedelta(days=7))
        .limit(1)
    )
    if not recent_post.scalar_one_or_none():
        return 1 if random.random() < (2 / 60) else 0

    viral_result = await session.execute(
        select(Post.id)
        .where(
            Post.user_id == user.id,
            Post.is_viral == True,
            Post.created_at >= now - timedelta(hours=48),
        )
        .limit(1)
    )
    if viral_result.scalar_one_or_none():
        return 1

    return 1 if random.random() < (10 / 60) else 0


async def apply_follower_growth(
    session: AsyncSession,
    user_id: UUID,
    amount: int,
    *,
    push: bool = True,
    run_milestone_check: bool = True,
) -> dict:
    if amount <= 0:
        return {"tier1": 0, "tier2": 0, "tier3": 0, "total": 0}

    tier1_count, tier2_count, tier3_count = _split_growth_tiers(amount)
    tier1_users: list[FakeUser] = []
    tier2_users: list[FakeUser] = []
    new_follows = 0

    if tier1_count > 0:
        tier1_result = await session.execute(
            select(FakeUser)
            .where(FakeUser.tier == 1)
            .order_by(func.random())
            .limit(tier1_count)
        )
        tier1_users = list(tier1_result.scalars().all())
        for fu in tier1_users:
            result = await session.execute(
                pg_insert(Follow)
                .values(user_id=user_id, fake_user_id=fu.id)
                .on_conflict_do_nothing(index_elements=["user_id", "fake_user_id"])
                .returning(Follow.id)
            )
            if result.scalar_one_or_none():
                new_follows += 1

    if tier2_count > 0:
        tier2_result = await session.execute(
            select(FakeUser)
            .where(FakeUser.tier == 2)
            .order_by(func.random())
            .limit(tier2_count)
        )
        tier2_users = list(tier2_result.scalars().all())
        for fu in tier2_users:
            result = await session.execute(
                pg_insert(Follow)
                .values(user_id=user_id, fake_user_id=fu.id)
                .on_conflict_do_nothing(index_elements=["user_id", "fake_user_id"])
                .returning(Follow.id)
            )
            if result.scalar_one_or_none():
                new_follows += 1

    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return {"tier1": 0, "tier2": 0, "tier3": 0, "total": 0}

    user.follower_count = (user.follower_count or 0) + amount
    user.following_count = (user.following_count or 0) + new_follows
    user.level = get_user_level(user.follower_count)

    session.add(FollowerGrowthLog(user_id=user_id, amount=amount, reason="passive"))

    await notify_follower_growth(
        session,
        user_id,
        tier1_users,
        tier2_users,
        tier3_count,
        total=amount,
        push=push,
    )
    if run_milestone_check:
        await check_milestones(session, user_id, follower_count=user.follower_count)

    return {
        "tier1": tier1_count,
        "tier2": tier2_count,
        "tier3": tier3_count,
        "total": amount,
    }


async def passive_growth(session: AsyncSession) -> int:
    now = _utc_now()
    result = await session.execute(select(User))
    users = result.scalars().all()
    total = 0
    skip_milestones = settings.environment == "development"

    for user in users:
        amount = await calculate_growth_amount(session, user)
        if amount <= 0:
            continue
        await apply_follower_growth(
            session,
            user.id,
            amount,
            push=False,
            run_milestone_check=not skip_milestones,
        )
        user.last_active = now
        total += amount

    return total


async def organic_growth(session: AsyncSession) -> int:
    """Saatlik pasif büyüme job'ı için alias."""
    return await passive_growth(session)


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
