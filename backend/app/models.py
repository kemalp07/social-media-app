import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(50), nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="")
    avatar_url: Mapped[str | None] = mapped_column(Text)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    tier_level: Mapped[str] = mapped_column(String(20), default="free")
    level: Mapped[str] = mapped_column(String(20), default="beginner")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    last_active: Mapped[datetime] = mapped_column(server_default=func.now())
    total_likes_received: Mapped[int] = mapped_column(Integer, default=0)
    fcm_token: Mapped[str | None] = mapped_column(Text)
    daily_posts_used: Mapped[int] = mapped_column(Integer, default=0)
    daily_dms_used: Mapped[int] = mapped_column(Integer, default=0)
    last_daily_reset: Mapped[date | None] = mapped_column(Date, server_default=func.current_date())

    posts: Mapped[list["Post"]] = relationship(back_populates="user")


class FakeUser(Base):
    __tablename__ = "fake_users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(50))
    avatar_seed: Mapped[str] = mapped_column(String(50), nullable=False)
    tier: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_open: Mapped[bool] = mapped_column(Boolean, default=False)
    personality_type: Mapped[str | None] = mapped_column(String(50))
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    bio: Mapped[str | None] = mapped_column(Text)
    follower_count: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    real_photo_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str] = mapped_column(Text, default="")
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    quality_score: Mapped[Decimal] = mapped_column(Numeric(3, 1), default=5.0)
    content_type: Mapped[str | None] = mapped_column(String(30))
    keywords: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    engagement_prediction: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    is_viral: Mapped[bool] = mapped_column(Boolean, default=False)
    location: Mapped[str | None] = mapped_column(String(100))
    target_like_count: Mapped[int] = mapped_column(Integer, default=0)
    likes_delivered: Mapped[int] = mapped_column(Integer, default=0)
    follower_gain: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="posts")


class ScheduledLike(Base):
    __tablename__ = "scheduled_likes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id"))
    scheduled_at: Mapped[datetime] = mapped_column(nullable=False)
    delivered: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    post: Mapped["Post"] = relationship()


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("post_id", "fake_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser"] = relationship()


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"))
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_template: Mapped[bool] = mapped_column(Boolean, default=True)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser"] = relationship()


class CommentTemplate(Base):
    __tablename__ = "comment_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("real_user_id", "fake_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    real_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id"))
    last_message: Mapped[str | None] = mapped_column(Text)
    last_message_at: Mapped[datetime] = mapped_column(server_default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    unread_count: Mapped[int] = mapped_column(Integer, default=0)
    started_by: Mapped[str] = mapped_column(String(10), default="ai")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser"] = relationship()
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"))
    sender: Mapped[str] = mapped_column(String(10), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    from_fake_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id"))
    post_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="SET NULL"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser | None"] = relationship()


class Milestone(Base):
    __tablename__ = "milestones"
    __table_args__ = (UniqueConstraint("user_id", "type"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    reached_at: Mapped[datetime] = mapped_column(server_default=func.now())
    reward: Mapped[str | None] = mapped_column(Text)


class FollowerGrowthLog(Base):
    __tablename__ = "follower_growth_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class FakePost(Base):
    __tablename__ = "fake_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id", ondelete="CASCADE"))
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str | None] = mapped_column(Text)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser"] = relationship()


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (UniqueConstraint("user_id", "fake_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    fake_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("fake_users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    fake_user: Mapped["FakeUser"] = relationship()
