import json
import re
from decimal import Decimal

import google.generativeai as genai

from app.config import settings
from app.schemas import PostAnalysis

genai.configure(api_key=settings.gemini_api_key)
MODEL = genai.GenerativeModel("gemini-2.0-flash")

PERSONALITY_PROMPTS = {
    "friendly": "Sıcak, samimi, emoji kullanan, destekleyici biri. Türkçe konuş.",
    "cool": "Sakin, kısa cevaplar veren, çok heyecanlanmayan, cool biri. Türkçe.",
    "flirty": "Biraz çekingen ama ilgili, iltifat eden, eğlenceli biri. Türkçe.",
    "hater": "Sinir bozucu, bazen eleştiren ama ayrılmayan, alaycı biri. Türkçe.",
    "brand": "Profesyonel, sponsorluk teklifi yapan marka hesabı. Türkçe.",
}


async def analyze_post(image_url: str, caption: str) -> PostAnalysis:
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
        response = MODEL.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_url}])
        text = response.text.strip()
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
    image_url: str,
    caption: str,
    personality_type: str,
    interests: list[str],
    display_name: str,
    comment_hints: list[str] | None = None,
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
        response = MODEL.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_url}])
        return response.text.strip().strip('"')[:120]
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
        response = MODEL.generate_content(prompt)
        return response.text.strip()[:250]
    except Exception:
        return "haha doğru söylüyorsun 😊"
