from uuid import UUID

from fastapi import APIRouter

from app.database import get_supabase
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/{user_id}")
async def get_feed(user_id: UUID, limit: int = 20, offset: int = 0):
    """Kullanıcı postları + fake user postları birleşik feed."""
    db = get_supabase()

    user_posts = (
        db.table("posts")
        .select("*, users(username, display_name, avatar_url)")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    fake_posts = (
        db.table("fake_posts")
        .select("*, fake_users(username, display_name, avatar_seed, tier, avatar_url, is_verified)")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    feed = []
    for p in user_posts.data or []:
        feed.append({**p, "is_own": True, "feed_type": "user"})

    for p in fake_posts.data or []:
        bot = p.get("fake_users") or {}
        feed.append({
            "id": p["id"],
            "image_url": p["image_url"],
            "caption": p.get("caption", ""),
            "like_count": p.get("like_count", 0),
            "comment_count": 0,
            "created_at": p["created_at"],
            "is_own": False,
            "feed_type": "fake",
            "users": {
                "username": bot.get("username"),
                "display_name": bot.get("display_name"),
                "avatar_url": bot.get("avatar_url") or dicebear_url(bot.get("avatar_seed", "")),
                "is_verified": bot.get("is_verified", False),
            },
        })

    feed.sort(key=lambda x: x["created_at"], reverse=True)
    return feed[:limit]
