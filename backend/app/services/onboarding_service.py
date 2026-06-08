"""Yeni kullanıcılar için başlangıç paketi — takipçi, post, beğeni, DM, bildirim."""
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Comment, Conversation, FakeUser, Like, Message, Milestone, Post, User
from app.services.growth_service import get_user_level
from app.services.notification_service import create_notification

WELCOME_IMAGE = (
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop&q=80"
)
WELCOME_CAPTION = "Yeni bir başlangıç. Hazır mısınız? 🚀"

COMMENT_SPECS = [
    ("ayse_fit", "Çok güzel! 🔥"),
    ("mert_photo", "Harika başlangıç 👏"),
    ("zeynep_mode", "Takip ettim! ❤️"),
]

DM_OPENERS = [
    "Heyy yeni takipçin oldum 👋",
    "Postların çok güzel, collab yapar mısın?",
    "Sponsorluk için görüşebilir miyiz? 💼",
    "Nasılsın? 😊",
    "Bu fotoğraf nerede çekildi?",
]

NOTIFICATION_SPECS = [
    ("like", "ayse_fit ve 346 kişi postunu beğendi", "ayse_fit"),
    ("comment", "mert_photo yorum yaptı: Harika başlangıç 👏", "mert_photo"),
    ("follow", "zeynep_mode ve 127 kişi seni takip etti", "zeynep_mode"),
    ("dm", "sponsor_spor sana mesaj gönderdi 💼", "sponsor_spor"),
    ("milestone", "10.000 takipçiye ulaştın! 🎉", None),
]


async def _fake_id_by_username(session: AsyncSession, username: str) -> UUID | None:
    result = await session.execute(select(FakeUser.id).where(FakeUser.username == username))
    row = result.scalar_one_or_none()
    return row


async def create_welcome_package(user_id: UUID, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return

    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)

    user.follower_count = 10_000
    user.total_likes_received = 347
    user.post_count = 1
    user.level = get_user_level(10_000)

    post = Post(
        user_id=user_id,
        image_url=WELCOME_IMAGE,
        caption=WELCOME_CAPTION,
        like_count=347,
        comment_count=len(COMMENT_SPECS),
        quality_score=Decimal("8.5"),
        created_at=two_hours_ago,
        target_like_count=347,
        likes_delivered=347,
        content_type="lifestyle",
    )
    db.add(post)
    await db.flush()

    tier3_result = await db.execute(select(FakeUser.id).where(FakeUser.tier == 3))
    tier3_ids = list(tier3_result.scalars().all())
    if tier3_ids:
        sample_size = min(347, len(tier3_ids))
        for fake_id in random.sample(tier3_ids, sample_size):
            db.add(Like(post_id=post.id, fake_user_id=fake_id))
        post.like_count = sample_size
        user.total_likes_received = sample_size

    for username, content in COMMENT_SPECS:
        fake_id = await _fake_id_by_username(db, username)
        if fake_id:
            db.add(
                Comment(
                    post_id=post.id,
                    fake_user_id=fake_id,
                    content=content,
                    is_template=True,
                    created_at=two_hours_ago + timedelta(minutes=random.randint(5, 90)),
                )
            )

    tier1_result = await db.execute(select(FakeUser).where(FakeUser.tier == 1))
    tier1_users = list(tier1_result.scalars().all())
    if tier1_users:
        sample_count = min(10, len(tier1_users))
        for fake in random.sample(tier1_users, sample_count):
            msg_content = random.choice(DM_OPENERS)
            conv = Conversation(
                real_user_id=user_id,
                fake_user_id=fake.id,
                last_message=msg_content,
                last_message_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 120)),
                started_by="ai",
                unread_count=1,
            )
            db.add(conv)
            await db.flush()
            db.add(
                Message(
                    conversation_id=conv.id,
                    sender="ai",
                    content=msg_content,
                    is_read=False,
                )
            )

    for ntype, content, fake_username in NOTIFICATION_SPECS:
        fake_id = await _fake_id_by_username(db, fake_username) if fake_username else None
        post_ref = post.id if ntype in ("like", "comment") else None
        await create_notification(
            db,
            user_id,
            ntype,
            content,
            from_fake_user_id=fake_id,
            post_id=post_ref,
        )

    db.add(
        Milestone(
            user_id=user_id,
            type="followers_10k",
            reward="10 bin! Sponsorlar yakında gelecek 🔥",
        )
    )
