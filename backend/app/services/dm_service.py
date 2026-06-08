import random
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Conversation, FakeUser, Message, User
from app.serializers import fake_user_to_dict, message_to_dict
from app.services.ai_service import generate_dm_response
from app.services.notification_service import create_notification

DM_OPENING_TEMPLATES = [
    "Heyy 👋", "Postun çok güzeldi 🔥", "Seni takip etmeye başladım 😊",
    "Bu nerede çekildi?", "Collab yapar mısın?", "Nasılsın?",
    "Profilin çok hoşuma gitti ✨", "Son postun harikaydı!",
    "Merhaba, uzun zamandır takip ediyorum", "Selam! Tanışmak isterim",
]

FREE_DAILY_DM_LIMIT = 5
PREMIUM_DAILY_DM_LIMIT = 999


def dm_limit_for_tier(tier_level: str) -> int:
    return PREMIUM_DAILY_DM_LIMIT if tier_level == "premium" else FREE_DAILY_DM_LIMIT


def calculate_daily_dm_initiations(follower_count: int) -> int:
    if follower_count < 1_000:
        return random.randint(2, 3)
    if follower_count < 10_000:
        return random.randint(5, 10)
    if follower_count < 100_000:
        return random.randint(10, 20)
    return random.randint(20, 30)


async def initiate_bot_dms(session: AsyncSession) -> int:
    users_result = await session.execute(select(User))
    users = users_result.scalars().all()
    bots_result = await session.execute(select(FakeUser).where(FakeUser.tier == 1))
    tier1_bots = list(bots_result.scalars().all())
    if not tier1_bots:
        return 0

    initiated = 0
    for user in users:
        dm_count = calculate_daily_dm_initiations(user.follower_count or 0)
        bots = random.sample(tier1_bots, min(dm_count, len(tier1_bots)))

        for bot in bots:
            existing = await session.execute(
                select(Conversation.id)
                .where(Conversation.real_user_id == user.id, Conversation.fake_user_id == bot.id)
            )
            if existing.scalar_one_or_none():
                continue

            opening = random.choice(DM_OPENING_TEMPLATES)
            conv = Conversation(
                real_user_id=user.id,
                fake_user_id=bot.id,
                last_message=opening,
                started_by="ai",
            )
            session.add(conv)
            await session.flush()
            session.add(Message(conversation_id=conv.id, sender="ai", content=opening))
            await notify_dm(session, user.id, fake_user_to_dict(bot), opening)
            initiated += 1

    return initiated


async def send_user_message(session: AsyncSession, conversation_id: UUID, user_id: UUID, content: str) -> dict:
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.fake_user))
        .where(Conversation.id == conversation_id, Conversation.real_user_id == user_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise ValueError("Conversation not found")

    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    if (user.daily_dms_used or 0) >= dm_limit_for_tier(user.tier_level):
        raise ValueError("Daily DM limit reached")

    session.add(Message(conversation_id=conversation_id, sender="user", content=content))
    conv.last_message = content
    conv.last_message_at = datetime.now(timezone.utc)
    user.daily_dms_used = (user.daily_dms_used or 0) + 1

    if random.random() < 0.15:
        return {"replied": False, "reason": "left_on_read"}

    hist_result = await session.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    history = [{"sender": m.sender, "content": m.content} for m in hist_result.scalars().all()]

    bot = conv.fake_user
    ai_reply = await generate_dm_response(
        username=bot.username if bot else "",
        personality_type=bot.personality_type if bot else "",
        interests=bot.interests if bot else [],
        display_name=(bot.display_name or bot.username) if bot else "Bot",
        bio=bot.bio if bot else "",
        conversation_history=history,
        user_message=content,
    )

    ai_msg = Message(conversation_id=conversation_id, sender="ai", content=ai_reply)
    session.add(ai_msg)
    conv.last_message = ai_reply
    conv.last_message_at = datetime.now(timezone.utc)
    await session.flush()

    return {"replied": True, "message": message_to_dict(ai_msg)}


STORY_REACTION_MESSAGES = {
    "❤️": "❤️",
    "😍": "😍 hikayeni çok beğendim!",
    "🔥": "🔥 hikayeni çok beğendim!",
    "😂": "😂 hikayeni çok beğendim!",
}


async def _get_or_create_conversation(
    session: AsyncSession,
    user_id: UUID,
    fake_user_id: UUID,
) -> Conversation:
    result = await session.execute(
        select(Conversation)
        .options(selectinload(Conversation.fake_user))
        .where(
            Conversation.real_user_id == user_id,
            Conversation.fake_user_id == fake_user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if conv:
        return conv

    bot_result = await session.execute(select(FakeUser).where(FakeUser.id == fake_user_id))
    bot = bot_result.scalar_one_or_none()
    if not bot or bot.tier != 1:
        raise ValueError("Can only react to Tier 1 character stories")

    conv = Conversation(
        real_user_id=user_id,
        fake_user_id=fake_user_id,
        started_by="user",
    )
    session.add(conv)
    await session.flush()
    await session.refresh(conv, attribute_names=["fake_user"])
    return conv


async def send_story_reaction(
    session: AsyncSession,
    user_id: UUID,
    fake_user_id: UUID,
    emoji: str,
) -> dict:
    user_result = await session.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    conv = await _get_or_create_conversation(session, user_id, fake_user_id)
    bot = conv.fake_user
    if not bot:
        bot_result = await session.execute(select(FakeUser).where(FakeUser.id == fake_user_id))
        bot = bot_result.scalar_one_or_none()
    if not bot:
        raise ValueError("Character not found")

    message_content = STORY_REACTION_MESSAGES.get(emoji, f"{emoji} hikayeni çok beğendim!")
    session.add(Message(conversation_id=conv.id, sender="user", content=message_content))
    conv.last_message = message_content
    conv.last_message_at = datetime.now(timezone.utc)

    hist_result = await session.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at)
    )
    history = [{"sender": m.sender, "content": m.content} for m in hist_result.scalars().all()]

    reaction_context = f"Sen @{user.username} hikayene {emoji} tepkisi verdi"
    ai_reply = await generate_dm_response(
        username=bot.username,
        personality_type=bot.personality_type or "friendly",
        interests=bot.interests or [],
        display_name=bot.display_name or bot.username,
        bio=bot.bio or "",
        conversation_history=history,
        user_message=reaction_context,
    )

    ai_msg = Message(conversation_id=conv.id, sender="ai", content=ai_reply)
    session.add(ai_msg)
    conv.last_message = ai_reply
    conv.last_message_at = datetime.now(timezone.utc)
    conv.unread_count = (conv.unread_count or 0) + 1

    notif_content = f"@{bot.username} hikayene {emoji} tepkisi verdi"
    await create_notification(
        session,
        user_id,
        "story_reaction",
        notif_content,
        from_fake_user_id=bot.id,
    )

    await session.flush()

    return {
        "conversation_id": str(conv.id),
        "user_message": message_content,
        "ai_reply": message_to_dict(ai_msg),
        "notification": notif_content,
    }
