from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import FCMTokenUpdate, UserCreate, UserResponse
from app.serializers import user_to_dict
from app.services.avatar_service import dicebear_url

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(
        username=data.username,
        display_name=data.display_name,
        bio=data.bio,
        avatar_url=dicebear_url(data.username),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user_to_dict(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user_to_dict(user)


@router.get("/by-username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user_to_dict(user)


@router.patch("/{user_id}/fcm-token")
async def update_fcm_token(user_id: UUID, data: FCMTokenUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.fcm_token = data.fcm_token
    return {"ok": True}


@router.patch("/{user_id}/premium")
async def upgrade_premium(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    user.tier_level = "premium"
    return {"tier_level": "premium"}
