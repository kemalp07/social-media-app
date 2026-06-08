from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FollowerGrowthLog, Message, Notification, User

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials
        from app.config import settings

        cred_path = settings.firebase_credentials_path or settings.google_application_credentials
        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
    except Exception:
        pass


async def create_notification(
    session: AsyncSession,
    user_id: UUID | str,
    notif_type: str,
    content: str,
    from_fake_user_id: UUID | str | None = None,
    post_id: UUID | str | None = None,
) -> None:
    session.add(Notification(
        user_id=UUID(str(user_id)),
        type=notif_type,
        content=content,
        from_fake_user_id=UUID(str(from_fake_user_id)) if from_fake_user_id else None,
        post_id=UUID(str(post_id)) if post_id else None,
    ))


async def send_push(session: AsyncSession, user_id: UUID | str, title: str, body: str) -> None:
    _init_firebase()
    if not _firebase_initialized:
        return
    try:
        from firebase_admin import messaging

        result = await session.execute(select(User.fcm_token).where(User.id == UUID(str(user_id))))
        token = result.scalar_one_or_none()
        if not token:
            return
        messaging.send(messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=token,
        ))
    except Exception:
        pass


async def notify_viral(session: AsyncSession, user_id: UUID | str, post_id: UUID | str) -> None:
    await create_notification(session, user_id, "viral", "Gönderin viral oluyor! 🔥", post_id=post_id)
    await send_push(session, user_id, "Viral!", "Gönderin viral oluyor! 🔥")


async def notify_dm(session: AsyncSession, user_id: UUID | str, fake_user: dict, message_preview: str) -> None:
    name = fake_user.get("display_name") or fake_user.get("username", "Someone")
    await create_notification(session, user_id, "dm", f"{name} sana mesaj gönderdi", fake_user.get("id"))


async def notify_story_reaction(
    session: AsyncSession,
    user_id: UUID | str,
    username: str,
    reaction: str = "❤️",
    from_fake_user_id: UUID | str | None = None,
) -> None:
    content = f"@{username} hikayene {reaction} tepkisi verdi"
    await create_notification(
        session,
        user_id,
        "story_reaction",
        content,
        from_fake_user_id=from_fake_user_id,
    )


async def send_daily_digest(session: AsyncSession, user_id: UUID | str) -> None:
    uid = UUID(str(user_id))
    from app.models import Conversation
    dm_result = await session.execute(
        select(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Conversation.real_user_id == uid, Message.sender == "ai", Message.is_read == False)
    )
    dm_count = dm_result.scalar() or 0

    from datetime import datetime, timedelta, timezone
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    growth_result = await session.execute(
        select(func.coalesce(func.sum(FollowerGrowthLog.amount), 0))
        .where(FollowerGrowthLog.user_id == uid, FollowerGrowthLog.created_at >= since)
    )
    overnight = growth_result.scalar() or 0

    if dm_count > 0:
        await send_push(session, user_id, "Mesajlar", f"{dm_count} yeni mesajın var")
    if overnight > 0:
        await send_push(session, user_id, "Takipçiler", f"Uyurken {overnight} takipçi kazandın")
