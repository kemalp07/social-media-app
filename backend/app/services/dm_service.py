import random
from uuid import UUID

from app.database import get_supabase
from app.services.ai_service import generate_dm_response
from app.services.notification_service import notify_dm

DM_OPENING_TEMPLATES = [
    "hey! love your content 🔥",
    "omg your last post was amazing",
    "hi! been following you for a while, had to say hi",
    "your aesthetic is everything ✨",
    "ok but how are you so good at this",
    "random but your profile is so cool",
    "hey! would love to collab sometime",
    "your vibe >>>",
    "noticed we have similar interests!",
    "had to reach out, your stuff is fire",
]

FREE_DAILY_DM_LIMIT = 5
PREMIUM_DAILY_DM_LIMIT = 999


def dm_limit_for_tier(tier_level: str) -> int:
    return PREMIUM_DAILY_DM_LIMIT if tier_level == "premium" else FREE_DAILY_DM_LIMIT


def calculate_daily_dm_initiations(follower_count: int) -> int:
    """Tier 1 bots initiate 2-30 DMs/day based on follower count."""
    if follower_count < 100:
        return random.randint(2, 5)
    if follower_count < 1000:
        return random.randint(5, 10)
    if follower_count < 10000:
        return random.randint(10, 20)
    return random.randint(20, 30)


async def initiate_bot_dms() -> int:
    """Cron: Tier 1 characters message users based on follower count."""
    db = get_supabase()
    users = db.table("users").select("id, follower_count").execute()
    tier1_bots = (
        db.table("fake_users")
        .select("id, username, display_name, personality_type")
        .eq("tier", 1)
        .execute()
    )

    if not tier1_bots.data:
        return 0

    initiated = 0
    for user in users.data or []:
        dm_count = calculate_daily_dm_initiations(user.get("follower_count", 0))
        bots = random.sample(tier1_bots.data, min(dm_count, len(tier1_bots.data)))

        for bot in bots:
            existing = (
                db.table("conversations")
                .select("id")
                .eq("real_user_id", user["id"])
                .eq("fake_user_id", bot["id"])
                .execute()
            )
            if existing.data:
                continue

            opening = random.choice(DM_OPENING_TEMPLATES)
            conv = db.table("conversations").insert({
                "real_user_id": user["id"],
                "fake_user_id": bot["id"],
                "last_message": opening,
                "started_by": "ai",
            }).execute()

            if conv.data:
                db.table("messages").insert({
                    "conversation_id": conv.data[0]["id"],
                    "sender": "ai",
                    "content": opening,
                }).execute()
                await notify_dm(user["id"], bot, opening)
                initiated += 1

    return initiated


async def send_user_message(conversation_id: UUID, user_id: UUID, content: str) -> dict:
    """User sends DM; AI responds with character personality."""
    db = get_supabase()

    conv = (
        db.table("conversations")
        .select("*, fake_users(*)")
        .eq("id", str(conversation_id))
        .eq("real_user_id", str(user_id))
        .single()
        .execute()
    )
    if not conv.data:
        raise ValueError("Conversation not found")

    user = db.table("users").select("tier_level, daily_dms_used, last_daily_reset").eq("id", str(user_id)).single().execute()
    tier = user.data.get("tier_level", "free")
    limit = dm_limit_for_tier(tier)

    if user.data.get("daily_dms_used", 0) >= limit:
        raise ValueError("Daily DM limit reached")

    db.table("messages").insert({
        "conversation_id": str(conversation_id),
        "sender": "user",
        "content": content,
    }).execute()

    db.table("conversations").update({
        "last_message": content,
        "last_message_at": "now()",
    }).eq("id", str(conversation_id)).execute()

    db.table("users").update({
        "daily_dms_used": user.data.get("daily_dms_used", 0) + 1,
    }).eq("id", str(user_id)).execute()

    # 15% chance bot leaves on read (realistic)
    if random.random() < 0.15:
        return {"replied": False, "reason": "left_on_read"}

    history = (
        db.table("messages")
        .select("sender, content")
        .eq("conversation_id", str(conversation_id))
        .order("created_at")
        .execute()
    )

    bot = conv.data.get("fake_users") or {}
    ai_reply = await generate_dm_response(
        personality_type=bot.get("personality_type", ""),
        interests=bot.get("interests") or [],
        display_name=bot.get("display_name") or bot.get("username", "Bot"),
        bio=bot.get("bio", ""),
        conversation_history=history.data or [],
        user_message=content,
    )

    msg = db.table("messages").insert({
        "conversation_id": str(conversation_id),
        "sender": "ai",
        "content": ai_reply,
    }).execute()

    db.table("conversations").update({
        "last_message": ai_reply,
        "last_message_at": "now()",
    }).eq("id", str(conversation_id)).execute()

    return {"replied": True, "message": msg.data[0] if msg.data else None}
