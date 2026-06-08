"""ORM → API dict helpers."""
from app.models import (
    Comment,
    Conversation,
    FakePost,
    FakeUser,
    Message,
    Notification,
    Post,
    User,
)


def user_to_dict(user: User) -> dict:
    from datetime import datetime, timezone

    created_at = user.created_at or datetime.now(timezone.utc)
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "bio": user.bio or "",
        "avatar_url": user.avatar_url,
        "follower_count": user.follower_count or 0,
        "following_count": user.following_count or 0,
        "post_count": user.post_count or 0,
        "tier_level": user.tier_level or "free",
        "level": user.level or "beginner",
        "total_likes_received": user.total_likes_received or 0,
        "created_at": created_at,
    }


def post_to_dict(post: Post, include_user: bool = False) -> dict:
    data = {
        "id": post.id,
        "user_id": post.user_id,
        "image_url": post.image_url,
        "caption": post.caption,
        "like_count": post.like_count,
        "comment_count": post.comment_count,
        "quality_score": float(post.quality_score) if post.quality_score else 5.0,
        "content_type": post.content_type,
        "keywords": post.keywords,
        "engagement_prediction": post.engagement_prediction,
        "is_viral": post.is_viral,
        "location": post.location,
        "target_like_count": post.target_like_count,
        "follower_gain": post.follower_gain,
        "created_at": post.created_at,
    }
    if include_user and post.user:
        data["users"] = {
            "username": post.user.username,
            "display_name": post.user.display_name,
            "avatar_url": post.user.avatar_url,
        }
    return data


def fake_user_to_dict(fu: FakeUser) -> dict:
    return {
        "id": fu.id,
        "username": fu.username,
        "display_name": fu.display_name,
        "avatar_seed": fu.avatar_seed,
        "avatar_url": fu.avatar_url,
        "tier": fu.tier,
        "is_open": fu.is_open,
        "personality_type": fu.personality_type,
        "interests": fu.interests,
        "bio": fu.bio,
        "follower_count": fu.follower_count,
        "post_count": fu.post_count,
        "is_verified": fu.is_verified,
    }


def conversation_to_dict(conv: Conversation) -> dict:
    data = {
        "id": conv.id,
        "fake_user_id": conv.fake_user_id,
        "real_user_id": conv.real_user_id,
        "last_message": conv.last_message,
        "last_message_at": conv.last_message_at,
        "started_by": conv.started_by,
        "unread_count": conv.unread_count,
        "is_active": conv.is_active,
    }
    if conv.fake_user:
        data["fake_users"] = fake_user_to_dict(conv.fake_user)
    return data


def message_to_dict(msg: Message) -> dict:
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender": msg.sender,
        "content": msg.content,
        "created_at": msg.created_at,
        "is_read": msg.is_read,
    }


def notification_to_dict(n: Notification) -> dict:
    data = {
        "id": n.id,
        "user_id": n.user_id,
        "type": n.type,
        "content": n.content,
        "is_read": n.is_read,
        "created_at": n.created_at,
        "from_fake_user_id": n.from_fake_user_id,
        "post_id": n.post_id,
    }
    if n.fake_user:
        data["fake_users"] = {
            "username": n.fake_user.username,
            "display_name": n.fake_user.display_name,
            "avatar_seed": n.fake_user.avatar_seed,
        }
    return data


def comment_to_dict(c: Comment) -> dict:
    data = {
        "id": c.id,
        "post_id": c.post_id,
        "fake_user_id": c.fake_user_id,
        "content": c.content,
        "is_template": c.is_template,
        "is_ai_generated": c.is_ai_generated,
        "created_at": c.created_at,
    }
    if c.fake_user:
        data["fake_users"] = fake_user_to_dict(c.fake_user)
    return data


def fake_post_to_dict(fp: FakePost) -> dict:
    return {
        "id": fp.id,
        "fake_user_id": fp.fake_user_id,
        "image_url": fp.image_url,
        "caption": fp.caption,
        "like_count": fp.like_count,
        "created_at": fp.created_at,
        "fake_users": fake_user_to_dict(fp.fake_user) if fp.fake_user else None,
    }
