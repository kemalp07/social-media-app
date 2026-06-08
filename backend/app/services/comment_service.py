import asyncio
import random
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Comment, CommentTemplate, FakeUser, Post
from app.services.ai_service import generate_ai_comment

from app.services.engagement_rates import quality_engagement_multiplier

CONTENT_TYPE_MAP = {
    "selfie": "selfie",
    "food": "food",
    "landscape": "landscape",
    "travel": "landscape",
    "sport": "sport",
    "nature": "landscape",
}

# Tier 3 — API yok, sadece basic şablon
BASIC_COMMENTS = [
    "Çok güzel! 🔥",
    "Harika 👏",
    "Süpermiş",
    "Bayıldım ❤️",
    "Muhteşem",
    "Efsane",
    "Çok iyi",
    "👏👏👏",
    "❤️❤️",
    "🔥🔥",
    "Wow",
    "Tam bir vibe",
    "Kusursuz",
    "İnanılmaz",
    "Çok beğendim",
    "Harika görünüyor",
    "Süper olmuş",
    "Mükemmel",
    "👍",
    "💯",
]


def _comment_counts(quality_score: float) -> tuple[int, int, int]:
    """tier1=AI, tier2=şablon (orta), tier3=şablon (basic toplu)."""
    q = min(10.0, max(1.0, float(quality_score)))
    mult = quality_engagement_multiplier(q)

    if q >= 10:
        return random.randint(4, 5), random.randint(18, 25), random.randint(70, 100)

    tier1_ai = min(5, max(2, random.randint(2, 3) + (1 if q >= 9.5 else 0)))
    tier2_tpl = min(25, max(2, int(q * 0.8 * mult)))
    tier3_tpl = min(100, max(5, int(q * 2.5 * mult)))
    return tier1_ai, tier2_tpl, tier3_tpl


async def _load_templates(session: AsyncSession, content_type: str) -> tuple[list[str], list[str]]:
    category = CONTENT_TYPE_MAP.get(content_type, "general")
    result = await session.execute(select(CommentTemplate.content, CommentTemplate.category))
    rows = result.all()

    typed: list[str] = []
    general: list[str] = []
    for content, cat in rows:
        if cat == category:
            typed.append(content)
        elif cat == "general":
            general.append(content)

    if not general:
        general = BASIC_COMMENTS.copy()
    if not typed:
        typed = general.copy()

    random.shuffle(typed)
    random.shuffle(general)
    return typed, general


async def _fetch_random_users(session: AsyncSession, tier: int, limit: int) -> list[FakeUser]:
    if limit <= 0:
        return []
    result = await session.execute(
        select(FakeUser)
        .where(FakeUser.tier == tier)
        .order_by(func.random())
        .limit(limit)
    )
    return list(result.scalars().all())


def _add_template_comments(
    session: AsyncSession,
    post_id: UUID,
    users: list[FakeUser],
    templates: list[str],
    used_ids: set[UUID],
    start_index: int = 0,
) -> tuple[int, int]:
    added = 0
    idx = start_index
    for user in users:
        if user.id in used_ids:
            continue
        if not templates:
            break
        used_ids.add(user.id)
        session.add(Comment(
            post_id=post_id,
            fake_user_id=user.id,
            content=templates[idx % len(templates)],
            is_template=True,
        ))
        idx += 1
        added += 1
    return added, idx


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
    tier1_count, tier2_count, tier3_count = _comment_counts(quality_score)
    typed_templates, basic_templates = await _load_templates(session, content_type)

    tier1_users = await _fetch_random_users(session, 1, tier1_count)
    tier2_users = await _fetch_random_users(session, 2, tier2_count)
    tier3_users = await _fetch_random_users(session, 3, tier3_count)

    comments_added = 0
    used_ids: set[UUID] = set()
    tpl_index = 0

    # Tier 2 — kategoriye uygun şablon (API yok)
    added, tpl_index = _add_template_comments(
        session, post_id, tier2_users, typed_templates, used_ids, tpl_index,
    )
    comments_added += added

    # Tier 3 — basic/general şablon (API yok)
    added, tpl_index = _add_template_comments(
        session, post_id, tier3_users, basic_templates, used_ids, tpl_index,
    )
    comments_added += added

    # Tier 1 — sadece karakterler Gemini ile (API)
    tier1_available = [u for u in tier1_users if u.id not in used_ids][:tier1_count]
    if tier1_available:
        ai_tasks = [
            generate_ai_comment(
                image_bytes=image_bytes,
                caption=caption,
                personality_type=u.personality_type or "friendly",
                interests=u.interests or [],
                display_name=u.display_name or u.username,
                comment_hints=comment_hints,
                mime_type=mime_type,
            )
            for u in tier1_available
        ]
        ai_comments = await asyncio.gather(*ai_tasks)
        for user, content in zip(tier1_available, ai_comments):
            used_ids.add(user.id)
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
