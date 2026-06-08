import random
from uuid import UUID

from app.database import get_supabase

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials

        from app.config import settings

        if settings.firebase_credentials_path:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
    except Exception:
        pass


async def create_notification(
    user_id: str,
    notif_type: str,
    content: str,
    from_fake_user_id: str | None = None,
    post_id: str | None = None,
) -> None:
    db = get_supabase()
    db.table("notifications").insert({
        "user_id": user_id,
        "type": notif_type,
        "content": content,
        "from_fake_user_id": from_fake_user_id,
        "post_id": post_id,
    }).execute()


async def send_push(user_id: str, title: str, body: str) -> None:
    _init_firebase()
    if not _firebase_initialized:
        return

    try:
        from firebase_admin import messaging

        db = get_supabase()
        user = db.table("users").select("fcm_token").eq("id", user_id).single().execute()
        token = user.data.get("fcm_token")
        if not token:
            return

        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            token=token,
        )
        messaging.send(message)
    except Exception:
        pass


async def notify_like(user_id: str, post_id: str, fake_user: dict, total_likes: int) -> None:
    """Individual like notification, then grouped style."""
    name = fake_user.get("display_name") or fake_user.get("username", "Someone")
    if total_likes <= 3:
        content = f"{name} gönderini beğendi"
    else:
        others = total_likes - 1
        content = f"{name} ve {others} kişi gönderini beğendi"

    await create_notification(user_id, "like", content, fake_user.get("id"), post_id)


async def notify_comment(user_id: str, post_id: str, fake_user: dict, comment_preview: str) -> None:
    name = fake_user.get("display_name") or fake_user.get("username", "Someone")
    preview = comment_preview[:50] + ("..." if len(comment_preview) > 50 else "")
    await create_notification(user_id, "comment", f"{name}: {preview}", fake_user.get("id"), post_id)


async def notify_dm(user_id: str, fake_user: dict, message_preview: str) -> None:
    name = fake_user.get("display_name") or fake_user.get("username", "Someone")
    await create_notification(user_id, "dm", f"{name} sana mesaj gönderdi", fake_user.get("id"))


async def notify_viral(user_id: str, post_id: str) -> None:
    await create_notification(user_id, "viral", "Gönderin viral oluyor! 🔥", post_id=post_id)
    await send_push(user_id, "Viral!", "Gönderin viral oluyor! 🔥")


async def send_daily_digest(user_id: str) -> None:
    db = get_supabase()
    unread_dms = (
        db.table("messages")
        .select("id, conversations!inner(real_user_id)")
        .eq("sender", "ai")
        .eq("is_read", False)
        .execute()
    )
    dm_count = len([m for m in (unread_dms.data or []) if m.get("conversations", {}).get("real_user_id") == user_id])

    growth = (
        db.table("follower_growth_log")
        .select("amount")
        .eq("user_id", user_id)
        .gte("created_at", "now() - interval '24 hours'")
        .execute()
    )
    overnight_followers = sum(g["amount"] for g in (growth.data or []))

    if dm_count > 0:
        await send_push(user_id, "Mesajlar", f"{dm_count} yeni mesajın var")
    if overnight_followers > 0:
        await send_push(user_id, "Takipçiler", f"Uyurken {overnight_followers} takipçi kazandın")
