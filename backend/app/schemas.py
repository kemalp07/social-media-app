from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    display_name: str = Field(min_length=1, max_length=50)
    bio: str = ""


class UserResponse(BaseModel):
    id: UUID
    username: str
    display_name: str
    bio: str
    avatar_url: str | None
    follower_count: int
    following_count: int
    post_count: int
    tier_level: str
    level: str = "beginner"
    total_likes_received: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    caption: str = ""
    location: str | None = None


class PostAnalysis(BaseModel):
    quality_score: Decimal
    content_type: str
    keywords: list[str]
    engagement_prediction: str = "medium"
    comment_hints: list[str] = []


class PostResponse(BaseModel):
    id: UUID
    user_id: UUID
    image_url: str
    caption: str
    like_count: int
    comment_count: int
    quality_score: Decimal
    content_type: str | None
    is_viral: bool
    created_at: datetime


class CommentResponse(BaseModel):
    id: UUID
    fake_user_id: UUID
    content: str
    is_template: bool
    created_at: datetime
    username: str | None = None
    avatar_url: str | None = None


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: UUID
    sender: Literal["user", "ai"]
    content: str
    created_at: datetime
    is_read: bool


class ConversationResponse(BaseModel):
    id: UUID
    fake_user_id: UUID
    last_message: str | None
    last_message_at: datetime
    started_by: str
    fake_username: str | None = None
    fake_avatar_url: str | None = None


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    content: str
    is_read: bool
    created_at: datetime
    from_fake_user_id: UUID | None = None
    post_id: UUID | None = None


class FCMTokenUpdate(BaseModel):
    fcm_token: str
