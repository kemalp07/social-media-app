"""Beğeni, yorum ve engagement hesaplama."""
import logging
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import FakeUser, Like, Post, ScheduledLike, User
from app.services.engagement_rates import (
    follower_gain_for_post,
    passive_like_tick_probability,
    target_likes_for_post,
)
from app.services.growth_service import check_milestones
from app.services.notification_service import notify_like

logger = logging.getLogger(__name__)

# İlk saat yoğun, sonra yavaşlayan drip (post beğenileri)
DRIP_WINDOWS = [(0, 5, 0.22), (5, 20, 0.35), (20, 60, 0.28), (60, 180, 0.15)]


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def calculate_engagement(quality_score: float, follower_count: int, is_premium: bool = False) -> dict:
    score = float(quality_score)
    if score >= 10:
        is_viral = True
    elif score >= 9.5:
        is_viral = random.random() < 0.55
    else:
        is_viral = score >= 8.5 and random.random() < 0.20
    target_likes = target_likes_for_post(
        follower_count,
        quality_score,
        is_premium=is_premium,
        is_viral=is_viral,
    )
    follower_gain = follower_gain_for_post(
        follower_count,
        quality_score,
        is_premium=is_premium,
    )
    return {"target_likes": target_likes, "follower_gain": follower_gain, "is_viral": is_viral}


async def _record_like(
    session: AsyncSession,
    post: Post,
    user: User,
    fake_user: FakeUser,
    *,
    push: bool = False,
) -> bool:
    result = await session.execute(
        pg_insert(Like)
        .values(post_id=post.id, fake_user_id=fake_user.id)
        .on_conflict_do_nothing(index_elements=["post_id", "fake_user_id"])
        .returning(Like.id)
    )
    if not result.scalar_one_or_none():
        return False

    post.like_count = (post.like_count or 0) + 1
    post.likes_delivered = (post.likes_delivered or 0) + 1
    user.total_likes_received = (user.total_likes_received or 0) + 1

    username = fake_user.username
    if username:
        await notify_like(
            session,
            user.id,
            username,
            post.id,
            from_fake_user_id=fake_user.id,
            push=push,
        )

    await check_milestones(
        session,
        user.id,
        follower_count=user.follower_count or 0,
        total_likes=user.total_likes_received,
        post_count=user.post_count or 0,
    )
    return True


async def schedule_likes(session: AsyncSession, post_id: UUID, target_count: int) -> None:
    # Tek seferde binlerce satır eklemeyi önle — upload hızlı kalsın
    schedule_count = min(max(target_count, 0), 300)
    if schedule_count <= 0:
        return

    result = await session.execute(
        select(FakeUser.id).where(FakeUser.tier >= 2).limit(schedule_count * 2)
    )
    fake_ids = [row[0] for row in result.all()]
    if not fake_ids:
        return

    random.shuffle(fake_ids)
    post_created = utc_now()
    scheduled = []

    for w_start, w_end, pct in DRIP_WINDOWS:
        window_likes = int(schedule_count * pct)
        duration = (w_end - w_start) * 60
        for _ in range(window_likes):
            if not fake_ids:
                break
            fid = fake_ids.pop()
            offset = w_start * 60 + random.randint(0, max(1, duration))
            scheduled.append(ScheduledLike(
                post_id=post_id,
                fake_user_id=fid,
                scheduled_at=post_created + timedelta(seconds=offset),
            ))

    session.add_all(scheduled)


async def deliver_pending_likes(session: AsyncSession, batch_size: int = 20) -> int:
    now = utc_now()
    result = await session.execute(
        select(ScheduledLike)
        .options(selectinload(ScheduledLike.post))
        .where(
            ScheduledLike.delivered == False,
            ScheduledLike.scheduled_at <= now,
        )
        .order_by(ScheduledLike.scheduled_at)
        .limit(batch_size)
    )
    pending = list(result.scalars().all())
    count = 0

    for item in pending:
        item.delivered = True
        if not item.post:
            continue

        user_result = await session.execute(
            select(User).where(User.id == item.post.user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        fu_result = await session.execute(
            select(FakeUser).where(FakeUser.id == item.fake_user_id)
        )
        fake_user = fu_result.scalar_one_or_none()
        if not fake_user:
            continue

        if await _record_like(session, item.post, user, fake_user, push=False):
            count += 1

    return count


async def passive_like_engagement(session: AsyncSession) -> int:
    """Mevcut postlara arka planda organik beğeni — post/hikaye atmaktan bağımsız."""
    users_result = await session.execute(
        select(User).where(User.post_count > 0)
    )
    users = users_result.scalars().all()
    count = 0

    for user in users:
        if random.random() >= passive_like_tick_probability(user.follower_count or 0):
            continue

        posts_result = await session.execute(
            select(Post)
            .where(Post.user_id == user.id)
            .order_by(Post.created_at.desc())
            .limit(10)
        )
        posts = list(posts_result.scalars().all())
        if not posts:
            continue

        post = random.choice(posts)

        for _ in range(4):
            fu_result = await session.execute(
                select(FakeUser)
                .where(FakeUser.tier.in_([1, 2]))
                .order_by(func.random())
                .limit(1)
            )
            fake_user = fu_result.scalar_one_or_none()
            if not fake_user:
                break
            if await _record_like(session, post, user, fake_user, push=False):
                count += 1
                break

    return count


async def run_like_engagement(session: AsyncSession) -> dict:
    """Zamanlanmış + arka plan beğenilerini tek tick'te işle."""
    scheduled = await deliver_pending_likes(session)
    passive = await passive_like_engagement(session)
    return {"scheduled": scheduled, "passive": passive, "total": scheduled + passive}
