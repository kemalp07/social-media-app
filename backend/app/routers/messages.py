from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.schemas import ConversationResponse, MessageCreate, MessageResponse
from app.services.avatar_service import dicebear_url
from app.services.dm_service import send_user_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations/{user_id}")
async def list_conversations(user_id: UUID):
    db = get_supabase()
    convs = (
        db.table("conversations")
        .select("*, fake_users(username, display_name, avatar_seed, avatar_url, tier)")
        .eq("real_user_id", str(user_id))
        .order("last_message_at", desc=True)
        .execute()
    )

    for c in convs.data or []:
        bot = c.get("fake_users") or {}
        c["fake_username"] = bot.get("display_name") or bot.get("username")
        c["fake_avatar_url"] = bot.get("avatar_url") or dicebear_url(bot.get("avatar_seed", ""))

    return convs.data


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: UUID, user_id: UUID):
    db = get_supabase()
    conv = (
        db.table("conversations")
        .select("id")
        .eq("id", str(conversation_id))
        .eq("real_user_id", str(user_id))
        .single()
        .execute()
    )
    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    messages = (
        db.table("messages")
        .select("*")
        .eq("conversation_id", str(conversation_id))
        .order("created_at")
        .execute()
    )

    db.table("messages").update({"is_read": True}).eq("conversation_id", str(conversation_id)).eq("sender", "ai").execute()
    return messages.data


@router.post("/conversations/{conversation_id}/send")
async def send_message(conversation_id: UUID, user_id: UUID, data: MessageCreate):
    try:
        result = await send_user_message(conversation_id, user_id, data.content)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/start/{user_id}/{fake_user_id}")
async def start_conversation(user_id: UUID, fake_user_id: UUID):
    """User initiates DM with Tier 1 character."""
    db = get_supabase()

    bot = db.table("fake_users").select("tier").eq("id", str(fake_user_id)).single().execute()
    if not bot.data or bot.data.get("tier") != 1:
        raise HTTPException(400, "Can only DM Tier 1 characters")

    existing = (
        db.table("conversations")
        .select("id")
        .eq("real_user_id", str(user_id))
        .eq("fake_user_id", str(fake_user_id))
        .execute()
    )
    if existing.data:
        return existing.data[0]

    conv = db.table("conversations").insert({
        "real_user_id": str(user_id),
        "fake_user_id": str(fake_user_id),
        "started_by": "user",
    }).execute()
    return conv.data[0]
