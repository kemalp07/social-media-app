from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Comment, Like, Post
from app.serializers import comment_to_dict, post_to_dict, user_to_dict
from app.services.avatar_service import dicebear_url
from app.services.post_service import create_post
from app.services.storage_service import save_image

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=dict)
async def create_new_post(
    user_id: UUID,
    caption: str = Form(""),
    location: str | None = Form(None),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    contents = await image.read()
    mime = image.content_type or "image/jpeg"
    filename = image.filename or "photo.jpg"
    image_url = save_image(user_id, filename, contents)

    try:
        return await create_post(db, user_id, image_url, contents, caption, location, mime)
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/feed/{user_id}")
async def get_feed(user_id: UUID, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [post_to_dict(p, include_user=True) for p in result.scalars().all()]


@router.get("/user/{user_id}")
async def get_user_posts(user_id: UUID, limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.user))
        .where(Post.user_id == user_id)
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [post_to_dict(p, include_user=True) for p in result.scalars().all()]


@router.get("/{post_id}")
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Post).options(selectinload(Post.user)).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")

    comments_result = await db.execute(
        select(Comment).options(selectinload(Comment.fake_user)).where(Comment.post_id == post_id).order_by(Comment.created_at)
    )
    comments = []
    for c in comments_result.scalars().all():
        cd = comment_to_dict(c)
        if c.fake_user and c.fake_user.tier >= 2:
            cd["username"] = c.fake_user.username
            cd["avatar_url"] = c.fake_user.avatar_url or dicebear_url(c.fake_user.avatar_seed)
        comments.append(cd)

    data = post_to_dict(post, include_user=True)
    if post.user:
        data["users"] = user_to_dict(post.user)
    data["comments"] = comments
    return data


@router.get("/{post_id}/likes")
async def get_post_likes(post_id: UUID, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Like)
        .options(selectinload(Like.fake_user))
        .where(Like.post_id == post_id)
        .order_by(Like.created_at.desc())
        .limit(limit)
    )
    likes = []
    for like in result.scalars().all():
        entry = {"id": like.id, "post_id": like.post_id, "created_at": like.created_at}
        if like.fake_user:
            entry["fake_users"] = {
                "username": like.fake_user.username,
                "display_name": like.fake_user.display_name,
                "avatar_seed": like.fake_user.avatar_seed,
                "tier": like.fake_user.tier,
            }
        likes.append(entry)
    return likes
