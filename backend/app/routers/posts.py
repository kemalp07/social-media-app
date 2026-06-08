from uuid import UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.database import get_supabase
from app.schemas import PostResponse
from app.services.post_service import create_post

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=dict)
async def create_new_post(
    user_id: UUID,
    caption: str = Form(""),
    location: str | None = Form(None),
    image: UploadFile = File(...),
):
    """Upload post image and trigger full engagement pipeline."""
    db = get_supabase()

    contents = await image.read()
    filename = f"{user_id}/{image.filename}"
    storage = db.storage.from_("posts")
    storage.upload(filename, contents, {"content-type": image.content_type or "image/jpeg"})
    image_url = storage.get_public_url(filename)

    try:
        result = await create_post(user_id, image_url, caption, location)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/feed/{user_id}")
async def get_feed(user_id: UUID, limit: int = 20, offset: int = 0):
    db = get_supabase()
    posts = (
        db.table("posts")
        .select("*, users(username, display_name, avatar_url)")
        .eq("user_id", str(user_id))
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return posts.data


@router.get("/{post_id}")
async def get_post(post_id: UUID):
    db = get_supabase()
    post = db.table("posts").select("*, users(*)").eq("id", str(post_id)).single().execute()
    if not post.data:
        raise HTTPException(404, "Post not found")

    comments = (
        db.table("comments")
        .select("*, fake_users(username, display_name, avatar_seed, tier, avatar_url)")
        .eq("post_id", str(post_id))
        .order("created_at")
        .execute()
    )

    for c in comments.data or []:
        bot = c.get("fake_users") or {}
        if bot.get("tier", 3) >= 2:
            from app.services.avatar_service import dicebear_url
            c["username"] = bot.get("username")
            c["avatar_url"] = bot.get("avatar_url") or dicebear_url(bot.get("avatar_seed", bot.get("username", "")))

    return {**post.data, "comments": comments.data}


@router.get("/{post_id}/likes")
async def get_post_likes(post_id: UUID, limit: int = 50):
    db = get_supabase()
    likes = (
        db.table("likes")
        .select("*, fake_users(username, display_name, avatar_seed, tier)")
        .eq("post_id", str(post_id))
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return likes.data
