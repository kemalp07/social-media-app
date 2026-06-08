from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import FakeUser, Notification, User
from app.serializers import notification_to_dict
from app.services.notification_service import create_notification

router = APIRouter(prefix="/notifications", tags=["notifications"])

STORY_REACTION_TYPE = "story_reaction"


class StoryReactionBody(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    reaction: str = Field(default="❤️", max_length=8)
    from_fake_user_id: UUID | None = None


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


@router.post("/{user_id}/story-reaction")
async def create_story_reaction(
    user_id: UUID,
    body: StoryReactionBody,
    db: AsyncSession = Depends(get_db),
):
    """Create a story_reaction notification, e.g. '@ayse_fit hikayene ❤️ tepkisi verdi'."""
    user_result = await db.execute(select(User.id).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    if body.from_fake_user_id:
        fake_result = await db.execute(
            select(FakeUser.id).where(FakeUser.id == body.from_fake_user_id)
        )
        if not fake_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Fake user not found")

    content = f"@{body.username} hikayene {body.reaction} tepkisi verdi"
    await create_notification(
        db,
        user_id,
        STORY_REACTION_TYPE,
        content,
        from_fake_user_id=body.from_fake_user_id,
    )
    await db.commit()
    return {"ok": True, "type": STORY_REACTION_TYPE, "content": content}
