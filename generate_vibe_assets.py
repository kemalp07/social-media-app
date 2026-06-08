"""
Vibe — Asset Üretici (Vertex AI Imagen)

Kullanım:
  pip install google-cloud-aiplatform pillow python-dotenv
  python generate_vibe_assets.py
  python generate_vibe_assets.py --only app_icon
  python generate_vibe_assets.py --category icons
  python generate_vibe_assets.py --category splash
  python generate_vibe_assets.py --category milestones

Kategoriler: icons, splash, milestones, empty_states
"""

import argparse
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env", override=True)

PROJECT_ID = os.getenv("VERTEX_AI_PROJECT_ID")
_env_location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
LOCATION = "us-central1" if _env_location == "global" else _env_location

# ─── STYLE PREFIX ─────────────────────────────────────────────────────────────
# Tüm asset'lerde tutarlı Vibe visual dili
ICON_STYLE = (
    "Minimal flat UI icon, pure white icon on pure black background, "
    "single color white, clean simple lines, no gradients, no shadows, no glow, "
    "no 3D effect, no texture, flat design, "
    "centered composition, square format, bold strokes, "
    "mobile app icon style, no text, no letters, no watermark, "
)

SPLASH_STYLE = (
    "Minimal flat illustration, pure white on pure black background, "
    "single color white, clean simple shapes, no gradients, no shadows, "
    "no 3D effect, flat design, bold strokes, "
    "no text, no characters, no watermark, centered composition, "
)

MILESTONE_STYLE = (
    "Minimal flat illustration, pure white on pure black background, "
    "single color white, clean simple shapes, no gradients, no shadows, "
    "no 3D effect, flat design, bold strokes, "
    "no text, no characters, no watermark, centered composition, "
)

# ─── ASSETS ───────────────────────────────────────────────────────────────────
ASSETS = {

    # ── APP İKONU ──────────────────────────────────────────────────────────────
    "app_icon": {
        "category": "app",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": (
            "Abstract letter V shape made of flowing electric blue and cyan light streams, "
            "dynamic energy waves spiraling inward, "
            "glowing neon blue core, deep space dark background, "
            "ultra premium app icon, luxury social media brand"
        ),
    },

    # ── SPLASH / ONBOARDING ────────────────────────────────────────────────────
    "splash_screen": {
        "category": "splash",
        "aspect": "9:16",
        "style": SPLASH_STYLE,
        "prompt": (
            "Vertical mobile splash screen, "
            "deep dark background with electric blue gradient aurora in center, "
            "subtle floating light orbs, "
            "smooth gradient from dark navy at edges to glowing blue-cyan center, "
            "ultra premium feel, minimal abstract"
        ),
    },
    "onboarding_1": {
        "category": "splash",
        "aspect": "9:16",
        "style": SPLASH_STYLE,
        "prompt": (
            "Abstract social network visualization, "
            "glowing nodes connected by electric blue light threads, "
            "network expanding outward from bright cyan center, "
            "dark space background, depth of field blur on edges, "
            "representing connection and community"
        ),
    },
    "onboarding_2": {
        "category": "splash",
        "aspect": "9:16",
        "style": SPLASH_STYLE,
        "prompt": (
            "Abstract camera and photography concept, "
            "glowing blue lens aperture shape in center, "
            "light rays emanating outward, "
            "floating geometric shapes suggesting photos and memories, "
            "electric blue and cyan gradient, dark background"
        ),
    },
    "onboarding_3": {
        "category": "splash",
        "aspect": "9:16",
        "style": SPLASH_STYLE,
        "prompt": (
            "Abstract growth and success concept, "
            "glowing upward arrow made of light particles, "
            "star burst explosion of blue and cyan light, "
            "floating number particles suggesting followers and likes, "
            "electric energy, premium dark background"
        ),
    },

    # ── UI İKONLARI ────────────────────────────────────────────────────────────
    "icon_like": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple heart shape icon, minimal flat white outline",
    },
    "icon_like_active": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple filled heart shape icon, minimal flat white solid",
    },
    "icon_comment": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple speech bubble icon, minimal flat white outline, small tail at bottom",
    },
    "icon_share": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple paper airplane send icon, minimal flat white outline, pointing up-right",
    },
    "icon_save": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple bookmark ribbon icon, minimal flat white outline",
    },
    "icon_dm": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple direct message envelope icon, minimal flat white outline with small arrow",
    },
    "icon_notification": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple bell notification icon, minimal flat white outline",
    },
    "icon_home": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple house home icon, minimal flat white outline, clean geometric shape",
    },
    "icon_explore": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple compass or search icon, minimal flat white outline",
    },
    "icon_add_post": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple plus symbol icon, minimal flat white, bold clean lines",
    },
    "icon_profile": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple person silhouette icon, minimal flat white outline, head and shoulders",
    },
    "icon_camera": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple camera icon, minimal flat white outline, circle lens in center",
    },
    "icon_verified": {
        "category": "icons",
        "aspect": "1:1",
        "style": ICON_STYLE,
        "prompt": "Simple checkmark badge icon, minimal flat white, circle with checkmark inside",
    },

    # ── MİLESTONE GÖRSELLERİ ──────────────────────────────────────────────────
    "milestone_100": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Celebration of first hundred, "
            "glowing number 100 made of electric blue light particles, "
            "small confetti burst in blue and cyan, "
            "subtle star sparkles, beginning of a journey feeling, "
            "dark background with soft gradient glow"
        ),
    },
    "milestone_1k": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Epic celebration of 1000 followers, "
            "glowing 1K text made of flowing light streams, "
            "confetti explosion in blue cyan and white, "
            "star burst radiating outward, "
            "exciting energy particles, dark premium background"
        ),
    },
    "milestone_10k": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Major celebration 10K milestone, "
            "glowing 10K formed by thousands of tiny light particles, "
            "massive confetti explosion, light rays bursting from center, "
            "electric blue and cyan energy waves, "
            "crown or star shape in background glow, premium achievement"
        ),
    },
    "milestone_100k": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Legendary 100K achievement celebration, "
            "massive glowing 100K in electric blue fire and light, "
            "epic confetti storm, golden crown made of light above, "
            "shockwave rings expanding outward, "
            "ultra premium achievement feeling, epic scale"
        ),
    },
    "milestone_1m": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Ultimate 1 million celebration, mega star status, "
            "1M text made of supernova explosion light, "
            "massive light burst filling entire frame, "
            "electric blue and cyan aurora effect, "
            "infinite particle explosion, "
            "legendary achievement, god-tier energy"
        ),
    },
    "milestone_viral": {
        "category": "milestones",
        "aspect": "1:1",
        "style": MILESTONE_STYLE,
        "prompt": (
            "Viral post explosion celebration, "
            "fire emoji made of electric blue and cyan flame, "
            "spreading wave rings suggesting viral spread, "
            "network nodes lighting up rapidly, "
            "explosive energy, trending upward motion"
        ),
    },

    # ── BOŞ DURUM GÖRSELLERİ ──────────────────────────────────────────────────
    "empty_feed": {
        "category": "empty_states",
        "aspect": "1:1",
        "style": SPLASH_STYLE,
        "prompt": (
            "Empty social media feed illustration, "
            "abstract floating photo frames with soft glow outlines, "
            "question mark made of light particles in center, "
            "electric blue and cyan ghost frames, "
            "inviting and friendly feeling, dark background"
        ),
    },
    "empty_dm": {
        "category": "empty_states",
        "aspect": "1:1",
        "style": SPLASH_STYLE,
        "prompt": (
            "Empty messages inbox illustration, "
            "floating speech bubbles made of light outlines, "
            "soft electric blue glow, "
            "bubbles of different sizes floating upward, "
            "inviting and hopeful feeling, dark background"
        ),
    },
    "empty_notifications": {
        "category": "empty_states",
        "aspect": "1:1",
        "style": SPLASH_STYLE,
        "prompt": (
            "Empty notifications illustration, "
            "sleeping bell icon with soft zzz particles in blue, "
            "peaceful quiet feeling, "
            "subtle stars and moon shapes, "
            "electric blue glow, dark background, friendly"
        ),
    },
}

# ─── MODEL LİSTESİ ────────────────────────────────────────────────────────────
MODELS_TO_TRY = [
    "imagen-3.0-generate-002",
    "imagen-3.0-generate-001",
    "imagegeneration@006",
    "imagegeneration@005",
]

# ─── ASPECT RATIO → BOYUT MAP ─────────────────────────────────────────────────
ASPECT_OUTPUT_DIRS = {
    "app":          "assets/app",
    "splash":       "assets/splash",
    "icons":        "assets/icons",
    "milestones":   "assets/milestones",
    "empty_states": "assets/empty_states",
}


def generate_image(project_id, location, key, asset, base_output_dir):
    category = asset["category"]
    aspect = asset["aspect"]
    style = asset["style"]
    prompt = asset["prompt"]

    category_dir = base_output_dir / ASPECT_OUTPUT_DIRS[category]
    category_dir.mkdir(parents=True, exist_ok=True)

    output_path = category_dir / f"{key}.png"

    if output_path.exists():
        print(f"  ⏭  Zaten var, atlandı: {key}.png")
        return True

    import vertexai
    from vertexai.preview.vision_models import ImageGenerationModel

    vertexai.init(project=project_id, location=location)

    full_prompt = style + prompt

    for model_name in MODELS_TO_TRY:
        try:
            model = ImageGenerationModel.from_pretrained(model_name)
            response = model.generate_images(
                prompt=full_prompt,
                number_of_images=1,
                aspect_ratio=aspect,
            )
            if response.images:
                response.images[0].save(str(output_path))
                print(f"  ✅ Kaydedildi: {category}/{key}.png ({model_name})")
                return True
        except Exception as e:
            print(f"  ⚠  {model_name}: {e}")
            continue

    print(f"  ❌ Tüm modeller başarısız: {key}")
    return False


def main():
    parser = argparse.ArgumentParser(description="Vibe Asset Üretici")
    parser.add_argument("--output", default="./vibe-app", help="Çıktı dizini")
    parser.add_argument("--only", default=None, help="Sadece bu asset'i üret (örn: app_icon)")
    parser.add_argument("--category", default=None, help="Sadece bu kategoriyi üret (icons/splash/milestones/empty_states/app)")
    parser.add_argument("--delay", type=float, default=3.0, help="İstekler arası bekleme (saniye)")
    args = parser.parse_args()

    if not PROJECT_ID:
        print("❌ VERTEX_AI_PROJECT_ID .env'de bulunamadı!")
        return

    print(f"\n🎨 Vibe Asset Üretici — Vertex AI Imagen")
    print(f"📋 Project: {PROJECT_ID} | Location: {LOCATION}")

    base_output_dir = Path(args.output)
    base_output_dir.mkdir(parents=True, exist_ok=True)
    print(f"📁 Çıktı: {base_output_dir.absolute()}\n")

    # Filtrele
    assets_to_generate = ASSETS

    if args.only:
        if args.only not in ASSETS:
            print(f"❌ Bilinmeyen asset: {args.only}")
            print(f"Mevcut asset'ler: {', '.join(ASSETS.keys())}")
            return
        assets_to_generate = {args.only: ASSETS[args.only]}

    elif args.category:
        assets_to_generate = {
            k: v for k, v in ASSETS.items()
            if v["category"] == args.category
        }
        if not assets_to_generate:
            print(f"❌ Bilinmeyen kategori: {args.category}")
            print(f"Kategoriler: icons, splash, milestones, empty_states, app")
            return

    # Kategori özeti
    from collections import Counter
    cats = Counter(v["category"] for v in assets_to_generate.values())
    print(f"🖼  Toplam asset: {len(assets_to_generate)}")
    for cat, count in cats.items():
        print(f"   {cat}: {count} adet")
    print()

    success = 0
    fail = 0

    for i, (key, asset) in enumerate(assets_to_generate.items(), 1):
        print(f"[{i}/{len(assets_to_generate)}] {asset['category']}/{key}")
        ok = generate_image(PROJECT_ID, LOCATION, key, asset, base_output_dir)
        if ok:
            success += 1
        else:
            fail += 1
        if i < len(assets_to_generate):
            time.sleep(args.delay)

    print(f"\n✅ Başarılı: {success} | ❌ Başarısız: {fail}")
    print(f"📁 Asset'ler: {base_output_dir.absolute()}")
    print(f"\nKlasör yapısı:")
    print(f"  vibe-app/assets/app/          → app_icon.png")
    print(f"  vibe-app/assets/splash/       → splash, onboarding görselleri")
    print(f"  vibe-app/assets/icons/        → tüm UI ikonları")
    print(f"  vibe-app/assets/milestones/   → kutlama görselleri")
    print(f"  vibe-app/assets/empty_states/ → boş durum görselleri")


if __name__ == "__main__":
    main()
