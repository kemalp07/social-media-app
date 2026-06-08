import json
import re
from decimal import Decimal

import google.generativeai as genai

from app.config import settings
from app.schemas import PostAnalysis

genai.configure(api_key=settings.gemini_api_key)
MODEL = genai.GenerativeModel("gemini-2.0-flash")


async def analyze_post(image_url: str, caption: str) -> PostAnalysis:
    """Analyze post image + caption with Gemini Flash."""
    prompt = f"""Analyze this social media post.
Caption: "{caption}"

Return ONLY valid JSON with:
- quality_score: float 1-10 (composition, appeal, engagement potential)
- content_type: one of selfie, food, landscape, sport, other
- keywords: array of 3-5 relevant keywords

Example: {{"quality_score": 7.5, "content_type": "selfie", "keywords": ["sunset", "portrait", "smile"]}}"""

    try:
        response = MODEL.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_url}])
        text = response.text.strip()
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return PostAnalysis(
                quality_score=Decimal(str(min(10, max(1, data.get("quality_score", 5))))),
                content_type=data.get("content_type", "other"),
                keywords=data.get("keywords", []),
            )
    except Exception:
        pass

    return PostAnalysis(quality_score=Decimal("5.0"), content_type="other", keywords=[])


async def generate_ai_comment(
    image_url: str,
    caption: str,
    personality_type: str,
    interests: list[str],
    display_name: str,
) -> str:
    """Generate a personality-driven comment from a Tier 1 character."""
    interests_str = ", ".join(interests or ["general topics"])
    prompt = f"""You are {display_name}, a social media personality.
Personality: {personality_type or 'friendly and supportive'}
Interests: {interests_str}

Write ONE short, authentic comment (max 100 chars) on this post.
Caption: "{caption}"
Be natural, not generic. No hashtags. Match your personality."""

    try:
        response = MODEL.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_url}])
        comment = response.text.strip().strip('"')
        return comment[:150]
    except Exception:
        return "Love this! 🔥"


async def generate_dm_response(
    personality_type: str,
    interests: list[str],
    display_name: str,
    bio: str,
    conversation_history: list[dict],
    user_message: str,
) -> str:
    """Generate AI DM response maintaining character personality."""
    history_text = "\n".join(
        f"{'User' if m['sender'] == 'user' else display_name}: {m['content']}"
        for m in conversation_history[-10:]
    )
    interests_str = ", ".join(interests or [])

    prompt = f"""You are {display_name} messaging on a social app.
Bio: {bio or 'Social media personality'}
Personality: {personality_type or 'warm, engaging, slightly mysterious'}
Interests: {interests_str}

Recent conversation:
{history_text}

User just said: "{user_message}"

Reply as {display_name} in 1-3 short messages style (one paragraph).
Stay in character. Be realistic - sometimes brief, sometimes don't answer everything.
Occasionally leave on read energy is ok in tone but always reply.
Max 200 characters. No meta commentary."""

    try:
        response = MODEL.generate_content(prompt)
        return response.text.strip()[:300]
    except Exception:
        return "haha fair point 😊"
