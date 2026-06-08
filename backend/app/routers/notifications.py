from uuid import UUID

from fastapi import APIRouter

from app.database import get_supabase

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{user_id}")
async def get_notifications(user_id: UUID, limit: int = 50):
    db = get_supabase()
    notifs = (
        db.table("notifications")
        .select("*, fake_users(username, display_name, avatar_seed)")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return notifs.data


@router.patch("/{user_id}/read-all")
async def mark_all_read(user_id: UUID):
    db = get_supabase()
    db.table("notifications").update({"is_read": True}).eq("user_id", str(user_id)).execute()
    return {"ok": True}


@router.get("/{user_id}/unread-count")
async def unread_count(user_id: UUID):
    db = get_supabase()
    notifs = (
        db.table("notifications")
        .select("id", count="exact")
        .eq("user_id", str(user_id))
        .eq("is_read", False)
        .execute()
    )
    return {"count": notifs.count or 0}
