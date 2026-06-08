"""Yeni kullanıcılar için başlangıç paketi — takipçi, post, yorum, DM, bildirim."""
import logging
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Comment, Conversation, FakeUser, Follow, Message, Notification, Post, User
from app.services.growth_service import get_user_level

logger = logging.getLogger(__name__)

WELCOME_IMAGE = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800"
WELCOME_CAPTION = "Yeni bir başlangıç. Hazır mısınız? 🚀"

COMMENT_TEXTS = [
    "Çok güzel! 🔥",
    "Harika başlangıç 👏",
    "Takip ettim! ❤️",
]

DM_MESSAGES = [
    "Heyy yeni takipçin oldum 👋",
    "Postların çok güzel, collab yapar mısın?",
    "Sponsorluk için görüşebilir miyiz? 💼",
    "Nasılsın? 😊",
    "Bu fotoğraf nerede çekildi?",
    "Takip ettim, takip atar mısın? 🙏",
    "İçeriklerini çok beğeniyorum!",
    "Seninle tanışmak istedim 😊",
    "Harika bir profil! ✨",
    "Yeni içerik ne zaman geliyor? 👀",
]

NOTIFICATIONS = [
    ("like", "ayse_fit ve 346 kişi postunu beğendi"),
    ("comment", "mert_photo yorum yaptı: Harika başlangıç 👏"),
    ("follow", "zeynep_mode ve 127 kişi seni takip etti"),
    ("dm", "sponsor_spor sana mesaj gönderdi 💼"),
    ("milestone", "10.000 takipçiye ulaştın! 🎉"),
]


async def create_welcome_package(user_id: UUID, db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logger.warning("Welcome package skipped: user not found id=%s", user_id)
        return

    tier1_follow_result = await db.execute(
        select(FakeUser).where(FakeUser.tier == 1).order_by(FakeUser.username).limit(8)
    )
    tier1_follow_list = tier1_follow_result.scalars().all()
    if len(tier1_follow_list) < 8:
        logger.warning(
            "Welcome package: only %d tier-1 fake users for follows (need 8)",
            len(tier1_follow_list),
        )

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(
            follower_count=10_000,
            post_count=1,
            total_likes_received=347,
            following_count=len(tier1_follow_list),
            level=get_user_level(10_000),
        )
    )

    for fu in tier1_follow_list:
        db.add(Follow(user_id=user_id, fake_user_id=fu.id))

    post = Post(
        user_id=user_id,
        image_url=WELCOME_IMAGE,
        caption=WELCOME_CAPTION,
        like_count=347,
        comment_count=len(COMMENT_TEXTS),
        quality_score=Decimal("8.5"),
    )
    db.add(post)
    await db.flush()

    tier1_users = await db.execute(select(FakeUser).where(FakeUser.tier == 1).limit(3))
    tier1_list = tier1_users.scalars().all()
    if len(tier1_list) < len(COMMENT_TEXTS):
        logger.warning(
            "Welcome package: only %d tier-1 fake users for comments (need %d)",
            len(tier1_list),
            len(COMMENT_TEXTS),
        )
    for i, fu in enumerate(tier1_list[: len(COMMENT_TEXTS)]):
        db.add(
            Comment(
                post_id=post.id,
                fake_user_id=fu.id,
                content=COMMENT_TEXTS[i],
                is_template=True,
            )
        )

    tier1_all = await db.execute(select(FakeUser).where(FakeUser.tier == 1).limit(10))
    tier1_dm_list = tier1_all.scalars().all()
    if len(tier1_dm_list) < len(DM_MESSAGES):
        logger.warning(
            "Welcome package: only %d tier-1 fake users for DMs (need %d)",
            len(tier1_dm_list),
            len(DM_MESSAGES),
        )
    for i, fu in enumerate(tier1_dm_list[: len(DM_MESSAGES)]):
        conv = Conversation(
            real_user_id=user_id,
            fake_user_id=fu.id,
            last_message=DM_MESSAGES[i],
            started_by="ai",
            unread_count=1,
        )
        db.add(conv)
        await db.flush()
        db.add(
            Message(
                conversation_id=conv.id,
                sender="ai",
                content=DM_MESSAGES[i],
            )
        )

    for notif_type, content in NOTIFICATIONS:
        db.add(
            Notification(
                user_id=user_id,
                type=notif_type,
                content=content,
                is_read=False,
            )
        )

    await db.flush()
    logger.info(
        "Welcome package created for user=%s post=%s follows=%d comments=%d dms=%d notifications=%d",
        user_id,
        post.id,
        len(tier1_follow_list),
        min(len(tier1_list), len(COMMENT_TEXTS)),
        min(len(tier1_dm_list), len(DM_MESSAGES)),
        len(NOTIFICATIONS),
    )
