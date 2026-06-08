import asyncio
import random
from uuid import UUID

from app.database import get_supabase
from app.services.ai_service import generate_ai_comment

CONTENT_TYPE_MAP = {
    "selfie": "selfie",
    "food": "food",
    "landscape": "landscape",
    "sport": "sport",
}


async def add_comments_to_post(
    post_id: UUID,
    image_url: str,
    caption: str,
    content_type: str,
    quality_score: float,
    comment_hints: list[str] | None = None,
) -> int:
    """Add template + AI comments based on post quality."""
    db = get_supabase()

    template_count = min(15, max(3, int(quality_score * 1.5)))
    ai_count = random.randint(2, 3)

    tier2_users = (
        db.table("fake_users")
        .select("id, username, display_name, avatar_seed, tier, personality_type, interests")
        .eq("tier", 2)
        .limit(template_count + ai_count)
        .execute()
    )
    tier1_users = (
        db.table("fake_users")
        .select("id, username, display_name, avatar_seed, tier, personality_type, interests, bio")
        .eq("tier", 1)
        .limit(ai_count)
        .execute()
    )

    users_pool = (tier2_users.data or []) + (tier1_users.data or [])
    random.shuffle(users_pool)

    category = CONTENT_TYPE_MAP.get(content_type, "general")
    templates = (
        db.table("comment_templates")
        .select("content")
        .eq("category", category)
        .execute()
    )
    general_templates = (
        db.table("comment_templates")
        .select("content")
        .eq("category", "general")
        .execute()
    )

    all_templates = [t["content"] for t in (templates.data or [])]
    all_templates += [t["content"] for t in (general_templates.data or [])]
    random.shuffle(all_templates)

    comments_added = 0
    used_users = set()

    # Template comments from Tier 2
    for i in range(template_count):
        tier2 = [u for u in users_pool if u.get("tier") == 2 and u["id"] not in used_users]
        if not tier2 or not all_templates:
            break
        user = random.choice(tier2)
        used_users.add(user["id"])
        content = all_templates[i % len(all_templates)]
        db.table("comments").insert({
            "post_id": str(post_id),
            "fake_user_id": user["id"],
            "content": content,
            "is_template": True,
        }).execute()
        comments_added += 1

    # AI comments from Tier 1
    tier1_available = [u for u in (tier1_users.data or []) if u["id"] not in used_users]
    ai_tasks = []
    for user in tier1_available[:ai_count]:
        ai_tasks.append(
            generate_ai_comment(
                image_url=image_url,
                caption=caption,
                personality_type=user.get("personality_type", ""),
                interests=user.get("interests") or [],
                display_name=user.get("display_name") or user["username"],
                comment_hints=comment_hints,
            )
        )

    if ai_tasks:
        ai_comments = await asyncio.gather(*ai_tasks)
        for user, content in zip(tier1_available[:ai_count], ai_comments):
            db.table("comments").insert({
                "post_id": str(post_id),
                "fake_user_id": user["id"],
                "content": content,
                "is_template": False,
            }).execute()
            comments_added += 1

    if comments_added:
        db.table("posts").update({"comment_count": comments_added}).eq("id", str(post_id)).execute()

    return comments_added
