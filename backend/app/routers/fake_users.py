from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import FakePost, FakeUser
from app.serializers import fake_post_to_dict, fake_user_to_dict
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/fake-users", tags=["fake-users"])


@router.get("/explore/posts")
async def list_explore_posts(limit: int = 60, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(FakePost).order_by(FakePost.created_at.desc()).limit(limit)
    )
    return [
        {"id": str(p.id), "image_url": p.image_url, "caption": p.caption or ""}
        for p in result.scalars().all()
    ]


@router.get("/{fake_user_id}")
async def get_fake_user(fake_user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FakeUser).where(FakeUser.id == fake_user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    data = fake_user_to_dict(user)
    data["avatar_url"] = data.get("avatar_url") or dicebear_url(user.avatar_seed)

    if user.tier <= 2:
        fp_result = await db.execute(
            select(FakePost).where(FakePost.fake_user_id == fake_user_id).order_by(FakePost.created_at.desc()).limit(12 if user.tier == 1 else 3)
        )
        data["posts"] = [{"id": p.id, "image_url": p.image_url, "caption": p.caption, "like_count": p.like_count, "created_at": p.created_at} for p in fp_result.scalars().all()]

    return data


@router.get("/tier1/list")
async def list_tier1_characters(limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FakeUser).where(FakeUser.tier == 1).limit(limit))
    users = []
    for u in result.scalars().all():
        data = fake_user_to_dict(u)
        data["avatar_url"] = data.get("avatar_url") or dicebear_url(u.avatar_seed)
        users.append(data)
    return users
