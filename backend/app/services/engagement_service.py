"""Beğeni, yorum ve engagement hesaplama."""
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import FakeUser, Like, Post, ScheduledLike

DRIP_WINDOWS = [(0, 5, 0.10), (5, 30, 0.40), (30, 60, 0.30), (60, 1440, 0.20)]


def calculate_engagement(quality_score: float, follower_count: int, is_premium: bool = False) -> dict:
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
    is_viral = quality_score >= 8.5 and random.random() < 0.20
    if is_viral:
        target_likes *= 10
    if is_premium:
        target_likes = int(target_likes * 1.5)
        follower_gain *= 2

    return {"target_likes": target_likes, "follower_gain": follower_gain, "is_viral": is_viral}


async def schedule_likes(session: AsyncSession, post_id: UUID, target_count: int) -> None:
    result = await session.execute(
        select(FakeUser.id).where(FakeUser.tier >= 2).limit(target_count * 2)
    )
    fake_ids = [row[0] for row in result.all()]
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
            scheduled.append(ScheduledLike(
                post_id=post_id,
                fake_user_id=fid,
                scheduled_at=post_created + timedelta(seconds=offset),
            ))

    session.add_all(scheduled)


async def deliver_pending_likes(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    result = await session.execute(
        select(ScheduledLike)
        .options(selectinload(ScheduledLike.post))
        .where(ScheduledLike.delivered == False, ScheduledLike.scheduled_at <= now)
        .limit(100)
    )
    pending = result.scalars().all()
    count = 0

    for item in pending:
        try:
            session.add(Like(post_id=item.post_id, fake_user_id=item.fake_user_id))
            item.delivered = True
            if item.post:
                item.post.like_count = (item.post.like_count or 0) + 1
            count += 1
        except Exception:
            item.delivered = True

    return count
