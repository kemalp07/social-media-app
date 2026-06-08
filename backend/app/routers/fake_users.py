from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.database import get_supabase
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/fake-users", tags=["fake-users"])


@router.get("/{fake_user_id}")
async def get_fake_user(fake_user_id: UUID):
    db = get_supabase()
    user = db.table("fake_users").select("*").eq("id", str(fake_user_id)).single().execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    data = user.data
    if data.get("tier", 3) >= 2:
        data["avatar_url"] = data.get("avatar_url") or dicebear_url(data.get("avatar_seed", data["username"]))
    else:
        data["avatar_url"] = dicebear_url(data.get("avatar_seed", data["username"]))

    if data.get("tier") == 1:
        posts = (
            db.table("posts")
            .select("id, image_url, caption, like_count, created_at")
            .eq("user_id", str(fake_user_id))
            .order("created_at", desc=True)
            .limit(12)
            .execute()
        )
        data["posts"] = posts.data
    elif data.get("tier") == 2:
        posts = (
            db.table("posts")
            .select("id, image_url, caption, like_count, created_at")
            .limit(6)
            .execute()
        )
        data["posts"] = (posts.data or [])[:3]

    return data


@router.get("/tier1/list")
async def list_tier1_characters(limit: int = 50):
    """List DM-able Tier 1 characters."""
    db = get_supabase()
    users = (
        db.table("fake_users")
        .select("id, username, display_name, avatar_seed, avatar_url, bio, personality_type, interests, is_verified, follower_count")
        .eq("tier", 1)
        .limit(limit)
        .execute()
    )

    for u in users.data or []:
        u["avatar_url"] = u.get("avatar_url") or dicebear_url(u.get("avatar_seed", u["username"]))

    return users.data
