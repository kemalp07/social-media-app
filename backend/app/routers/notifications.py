from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Notification
from app.serializers import notification_to_dict

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{user_id}")
async def get_notifications(user_id: UUID, limit: int = 50, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Notification)
        .options(selectinload(Notification.fake_user))
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return [notification_to_dict(n) for n in result.scalars().all()]


@router.patch("/{user_id}/read-all")
async def mark_all_read(user_id: UUID, db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Notification).where(Notification.user_id == user_id).values(is_read=True)
    )
    return {"ok": True}


@router.get("/{user_id}/unread-count")
async def unread_count(user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id, Notification.is_read == False)
    )
    return {"count": result.scalar() or 0}
