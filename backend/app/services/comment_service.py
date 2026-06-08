import asyncio
import random
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Comment, CommentTemplate, FakeUser, Post
from app.services.ai_service import generate_ai_comment

CONTENT_TYPE_MAP = {"selfie": "selfie", "food": "food", "landscape": "landscape", "travel": "landscape", "sport": "sport", "nature": "landscape"}


async def add_comments_to_post(
    session: AsyncSession,
    post_id: UUID,
    image_bytes: bytes,
    caption: str,
    content_type: str,
    quality_score: float,
    comment_hints: list[str] | None = None,
    mime_type: str = "image/jpeg",
) -> int:
    template_count = min(15, max(3, int(quality_score * 1.5)))
    ai_count = random.randint(2, 3)

    tier2_result = await session.execute(
        select(FakeUser).where(FakeUser.tier == 2).limit(template_count + ai_count)
    )
    tier1_result = await session.execute(select(FakeUser).where(FakeUser.tier == 1).limit(ai_count))
    tier2_users = list(tier2_result.scalars().all())
    tier1_users = list(tier1_result.scalars().all())

    category = CONTENT_TYPE_MAP.get(content_type, "general")
    tpl_result = await session.execute(
        select(CommentTemplate.content).where(CommentTemplate.category.in_([category, "general"]))
    )
    all_templates = [row[0] for row in tpl_result.all()]
    random.shuffle(all_templates)

    comments_added = 0
    used_ids: set[UUID] = set()

    for i in range(template_count):
        available = [u for u in tier2_users if u.id not in used_ids]
        if not available or not all_templates:
            break
        user = random.choice(available)
        used_ids.add(user.id)
        session.add(Comment(
            post_id=post_id,
            fake_user_id=user.id,
            content=all_templates[i % len(all_templates)],
            is_template=True,
        ))
        comments_added += 1

    tier1_available = [u for u in tier1_users if u.id not in used_ids][:ai_count]
    if tier1_available:
        ai_tasks = [
            generate_ai_comment(
                image_bytes=image_bytes,
                caption=caption,
                personality_type=u.personality_type or "",
                interests=u.interests or [],
                display_name=u.display_name or u.username,
                comment_hints=comment_hints,
                mime_type=mime_type,
            )
            for u in tier1_available
        ]
        ai_comments = await asyncio.gather(*ai_tasks)
        for user, content in zip(tier1_available, ai_comments):
            session.add(Comment(
                post_id=post_id,
                fake_user_id=user.id,
                content=content,
                is_template=False,
                is_ai_generated=True,
            ))
            comments_added += 1

    if comments_added:
        post_result = await session.execute(select(Post).where(Post.id == post_id))
        post = post_result.scalar_one_or_none()
        if post:
            post.comment_count = comments_added

    return comments_added
