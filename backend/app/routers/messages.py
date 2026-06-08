from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Conversation, FakeUser, Message
from app.schemas import MessageCreate
from app.serializers import conversation_to_dict, message_to_dict
from app.services.avatar_service import dicebear_url
from app.services.dm_service import send_user_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations/{user_id}")
async def list_conversations(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.fake_user))
        .where(Conversation.real_user_id == user_id)
        .order_by(Conversation.last_message_at.desc())
    )
    convs = []
    for c in result.scalars().all():
        data = conversation_to_dict(c)
        if c.fake_user:
            data["fake_username"] = c.fake_user.display_name or c.fake_user.username
            data["fake_avatar_url"] = c.fake_user.avatar_url or dicebear_url(c.fake_user.avatar_seed)
        convs.append(data)
    return convs


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    conv_result = await db.execute(
        select(Conversation.id)
        .where(Conversation.id == conversation_id, Conversation.real_user_id == user_id)
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(404, "Conversation not found")

    msg_result = await db.execute(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )
    await db.execute(
        update(Message)
        .where(Message.conversation_id == conversation_id, Message.sender == "ai")
        .values(is_read=True)
    )
    return [message_to_dict(m) for m in msg_result.scalars().all()]


@router.post("/conversations/{conversation_id}/send")
async def send_message(conversation_id: UUID, user_id: UUID, data: MessageCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await send_user_message(db, conversation_id, user_id, data.content)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/start/{user_id}/{fake_user_id}")
async def start_conversation(user_id: UUID, fake_user_id: UUID, db: AsyncSession = Depends(get_db)):
    bot_result = await db.execute(select(FakeUser.tier).where(FakeUser.id == fake_user_id))
    tier = bot_result.scalar_one_or_none()
    if tier != 1:
        raise HTTPException(400, "Can only DM Tier 1 characters")

    existing = await db.execute(
        select(Conversation).where(
            Conversation.real_user_id == user_id,
            Conversation.fake_user_id == fake_user_id,
        )
    )
    conv = existing.scalar_one_or_none()
    if conv:
        return {"id": conv.id}

    conv = Conversation(real_user_id=user_id, fake_user_id=fake_user_id, started_by="user")
    db.add(conv)
    await db.flush()
    return {"id": conv.id}
