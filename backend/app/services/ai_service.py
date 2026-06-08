import asyncio
import json
import os
import re
from decimal import Decimal

import vertexai
from vertexai.generative_models import GenerativeModel, Part

from app.config import settings
from app.schemas import PostAnalysis

_initialized = False

PERSONALITY_PROMPTS = {
    "friendly": "Sıcak, samimi, emoji kullanan, destekleyici biri. Türkçe konuş.",
    "cool": "Sakin, kısa cevaplar veren, çok heyecanlanmayan, cool biri. Türkçe.",
    "flirty": "Biraz çekingen ama ilgili, iltifat eden, eğlenceli biri. Türkçe.",
    "hater": "Sinir bozucu, bazen eleştiren ama ayrılmayan, alaycı biri. Türkçe.",
    "brand": "Profesyonel, sponsorluk teklifi yapan marka hesabı. Türkçe.",
}


def _ensure_vertex():
    global _initialized
    if _initialized:
        return
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
    vertexai.init(project=settings.vertex_ai_project_id, location=settings.vertex_ai_location)
    _initialized = True


def _get_model() -> GenerativeModel:
    _ensure_vertex()
    return GenerativeModel(settings.vertex_ai_model)


def _generate_text_sync(prompt: str) -> str:
    model = _get_model()
    response = model.generate_content(prompt)
    return response.text.strip()


def _analyze_image_sync(image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> str:
    model = _get_model()
    image_part = Part.from_data(image_bytes, mime_type=mime_type)
    response = model.generate_content([prompt, image_part])
    return response.text.strip()


async def generate_text(prompt: str) -> str:
    return await asyncio.to_thread(_generate_text_sync, prompt)


async def analyze_image(image_bytes: bytes, prompt: str, mime_type: str = "image/jpeg") -> str:
    return await asyncio.to_thread(_analyze_image_sync, image_bytes, prompt, mime_type)


async def analyze_post(image_bytes: bytes, caption: str, mime_type: str = "image/jpeg") -> PostAnalysis:
    prompt = f"""Bu fotoğrafı sosyal medya post kalite skoru için analiz et.
Caption: "{caption}"

SADECE JSON döndür:
{{
  "quality_score": 1-10 float,
  "content_type": "selfie|food|travel|sport|nature|other",
  "keywords": ["anahtar", "kelimeler"],
  "engagement_prediction": "low|medium|high|viral",
  "comment_hints": ["Bu yorumu tetikleyebilir", "..."]
}}"""

    try:
        text = await analyze_image(image_bytes, prompt, mime_type)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return PostAnalysis(
                quality_score=Decimal(str(min(10, max(1, data.get("quality_score", 5))))),
                content_type=data.get("content_type", "other"),
                keywords=data.get("keywords", []),
                engagement_prediction=data.get("engagement_prediction", "medium"),
                comment_hints=data.get("comment_hints", []),
            )
    except Exception:
        pass

    return PostAnalysis(
        quality_score=Decimal("5.0"),
        content_type="other",
        keywords=[],
        engagement_prediction="medium",
        comment_hints=[],
    )


async def generate_ai_comment(
    image_bytes: bytes,
    caption: str,
    personality_type: str,
    interests: list[str],
    display_name: str,
    comment_hints: list[str] | None = None,
    mime_type: str = "image/jpeg",
) -> str:
    personality = PERSONALITY_PROMPTS.get(personality_type, PERSONALITY_PROMPTS["friendly"])
    hints = ", ".join(comment_hints or [])
    prompt = f"""Sen @{display_name} adlı sosyal medya kullanıcısısın.
Kişilik: {personality}
İlgi alanları: {', '.join(interests or [])}
Yorum ipuçları: {hints}

Bu posta kısa, doğal bir Türkçe yorum yaz (max 80 karakter).
Caption: "{caption}"
Hashtag kullanma."""

    try:
        text = await analyze_image(image_bytes, prompt, mime_type)
        return text.strip().strip('"')[:120]
    except Exception:
        return "Çok güzel! 🔥"


async def generate_dm_response(
    username: str,
    personality_type: str,
    interests: list[str],
    display_name: str,
    bio: str,
    conversation_history: list[dict],
    user_message: str,
) -> str:
    personality = PERSONALITY_PROMPTS.get(personality_type, PERSONALITY_PROMPTS["friendly"])
    history = "\n".join(
        f"{'Sen' if m['sender'] == 'ai' else 'Kullanıcı'}: {m['content']}"
        for m in conversation_history[-10:]
    )

    prompt = f"""Sen @{username} adlı sosyal medya kullanıcısısın.
Kişilik: {personality}
İlgi alanları: {', '.join(interests or [])}
Bio: {bio or ''}

Önceki konuşma:
{history}

Kullanıcı: "{user_message}"

Kısa, doğal sosyal medya dili kullan. Max 2 cümle. Türkçe."""

    try:
        return (await generate_text(prompt))[:250]
    except Exception:
        return "haha doğru söylüyorsun 😊"
