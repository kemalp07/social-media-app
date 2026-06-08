import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import FCMTokenUpdate, UserCreate, UserResponse
from app.serializers import user_to_dict
from app.services.onboarding_service import create_welcome_package

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User.id).where(User.username == data.username))
    if existing.scalar_one_or_none():
        logger.warning("Username already taken: %s", data.username)
        raise HTTPException(status_code=409, detail="Bu kullanıcı adı zaten alınmış")

    try:
        username = data.username.strip().lower()
        user = User(
            username=username,
            display_name=data.display_name.strip(),
            bio=(data.bio or "").strip(),
            avatar_url=f"https://api.dicebear.com/7.x/avataaars/png?seed={username}",
        )
        db.add(user)
        await db.flush()
        await create_welcome_package(user.id, db)
        await db.flush()
        await db.refresh(user)

        response = UserResponse(**user_to_dict(user))
        logger.info("User created: id=%s username=%s", user.id, user.username)
        return response

    except IntegrityError:
        await db.rollback()
        logger.warning("IntegrityError creating user: %s", data.username)
        raise HTTPException(status_code=409, detail="Bu kullanıcı adı zaten alınmış")

    except SQLAlchemyError as e:
        await db.rollback()
        logger.exception("Database error creating user %s: %s", data.username, e)
        raise HTTPException(status_code=500, detail="Veritabanı hatası, hesap oluşturulamadı")

    except Exception as e:
        await db.rollback()
        logger.exception("Unexpected error creating user %s: %s", data.username, e)
        raise HTTPException(status_code=500, detail="Hesap oluşturulamadı")


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return UserResponse(**user_to_dict(user))


@router.get("/username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: AsyncSession = Depends(get_db)):
    normalized = username.strip().lower()
    result = await db.execute(select(User).where(User.username == normalized))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return UserResponse(**user_to_dict(user))


@router.get("/by-username/{username}", response_model=UserResponse)
async def get_user_by_username_legacy(username: str, db: AsyncSession = Depends(get_db)):
    normalized = username.strip().lower()
    result = await db.execute(select(User).where(User.username == normalized))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return UserResponse(**user_to_dict(user))


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
