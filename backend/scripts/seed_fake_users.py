"""
Vibe fake user seed script.
Tier 3: 995K | Tier 2: 4.8K | Tier 1: 200 (20 hardcoded + generated)

Usage:
  python -m scripts.seed_fake_users --tier 1
  python -m scripts.seed_fake_users --tier 2 --count 4800
  python -m scripts.seed_fake_users --tier 3 --batch 1000
"""
import argparse
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_supabase

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable

ERKEK = ["Ahmet", "Mehmet", "Ali", "Mustafa", "Emre", "Burak", "Can", "Murat", "Oğuz", "Kemal",
         "Serkan", "Tolga", "Barış", "Cem", "Deniz", "Eren", "Furkan", "Gökhan", "Hakan", "İbrahim"]
KADIN = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Büşra", "Esra", "Gamze", "Hande",
         "İrem", "Kübra", "Leyla", "Melis", "Nazlı", "Özge", "Pınar", "Seda", "Tuğba", "Yasemin"]
SOYAD = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Arslan", "Doğan", "Aydın", "Öztürk",
         "Koç", "Kurt", "Aslan", "Polat", "Erdoğan", "Güneş", "Acar", "Tekin", "Bulut", "Taş"]

TIER1_HARDCODED = [
    {"username": "ayse_fit", "display_name": "Ayşe Kaya", "personality_type": "friendly", "interests": ["fitness", "nutrition", "travel"], "bio": "Fitness & sağlıklı yaşam 💪 Koşu tutkunu"},
    {"username": "mert_photo", "display_name": "Mert Arslan", "personality_type": "cool", "interests": ["photography", "music", "coffee"], "bio": "Fotoğrafçı | Kahve bağımlısı ☕"},
    {"username": "zeynep_mode", "display_name": "Zeynep Bal", "personality_type": "flirty", "interests": ["fashion", "beauty", "lifestyle"], "bio": "Moda & güzellik ✨ DM açık"},
    {"username": "sponsor_spor", "display_name": "SportBrand TR", "personality_type": "brand", "interests": ["fitness", "sport"], "bio": "Resmi sponsorluk hesabı 🏆 İşbirliği için DM"},
    {"username": "hater_anon", "display_name": "anon_x99", "personality_type": "hater", "interests": [], "bio": "..."},
    {"username": "elif_yoga", "display_name": "Elif Demir", "personality_type": "friendly", "interests": ["yoga", "wellness", "nature"], "bio": "Yoga eğitmeni 🧘 Huzur bul"},
    {"username": "can_music", "display_name": "Can Yıldız", "personality_type": "cool", "interests": ["music", "guitar", "concerts"], "bio": "Müzisyen 🎸 Yeni single yakında"},
    {"username": "merve_food", "display_name": "Merve Koç", "personality_type": "friendly", "interests": ["food", "cooking", "travel"], "bio": "Yemek blogcusu 🍕 Tarifler için takip et"},
    {"username": "burak_tech", "display_name": "Burak Şahin", "personality_type": "cool", "interests": ["tech", "gaming", "ai"], "bio": "Tech reviewer | Gamer 🎮"},
    {"username": "selin_travel", "display_name": "Selin Aydın", "personality_type": "flirty", "interests": ["travel", "photography", "adventure"], "bio": "Dünyayı geziyorum 🌍 32 ülke"},
    {"username": "emre_fitness", "display_name": "Emre Güneş", "personality_type": "friendly", "interests": ["fitness", "bodybuilding", "nutrition"], "bio": "PT & coach 💪 DM'den program"},
    {"username": "buse_fashion", "display_name": "Büşra Çelik", "personality_type": "flirty", "interests": ["fashion", "shopping", "lifestyle"], "bio": "Stil danışmanı 👗"},
    {"username": "oguz_photo", "display_name": "Oğuz Polat", "personality_type": "cool", "interests": ["photography", "nature", "travel"], "bio": "Doğa fotoğrafçısı 📸"},
    {"username": "nazli_art", "display_name": "Nazlı Erdoğan", "personality_type": "friendly", "interests": ["art", "design", "museums"], "bio": "Sanatçı & illüstratör 🎨"},
    {"username": "tolga_comedy", "display_name": "Tolga Acar", "personality_type": "flirty", "interests": ["comedy", "entertainment", "memes"], "bio": "Komedyen 😂 Gülmek serbest"},
    {"username": "pinar_beauty", "display_name": "Pınar Tekin", "personality_type": "friendly", "interests": ["beauty", "skincare", "makeup"], "bio": "Makyaj artisti 💄"},
    {"username": "hakan_sport", "display_name": "Hakan Bulut", "personality_type": "cool", "interests": ["football", "sport", "fitness"], "bio": "Eski futbolcular | Analist ⚽"},
    {"username": "yasemin_book", "display_name": "Yasemin Taş", "personality_type": "friendly", "interests": ["books", "writing", "poetry"], "bio": "Yazar & okur 📚"},
    {"username": "deniz_surf", "display_name": "Deniz Kurt", "personality_type": "cool", "interests": ["surf", "beach", "travel"], "bio": "Sörfçü 🏄 Bodrum"},
    {"username": "kubra_dance", "display_name": "Kübra Aslan", "personality_type": "flirty", "interests": ["dance", "music", "fitness"], "bio": "Dans eğitmeni 💃"},
]

BIOS_T2 = [
    "Hayat güzel ✨", "Kahve ve kitap ☕📚", "Yolculuk tutkunu 🌍",
    "Spor yap, mutlu ol 💪", "Anı yaşa 📸", "Pozitif enerji ⚡",
    "İstanbul 🌉", "Doğa sever 🌿", "Müzik her şeydir 🎵",
]

EXTRA_PERSONALITIES = ["friendly", "cool", "flirty", "friendly", "cool"]
EXTRA_INTERESTS = [
    ["fitness", "health"], ["travel", "food"], ["music", "art"],
    ["fashion", "beauty"], ["tech", "gaming"], ["sport", "nature"],
]


def turkish_name() -> tuple[str, str, str]:
    is_male = random.random() < 0.5
    first = random.choice(ERKEK if is_male else KADIN)
    last = random.choice(SOYAD)
    suffix = random.randint(100, 9999)
    tag = random.choice(["fit", "life", "daily", "world", "tr", "x", ""])
    username = f"{first.lower()}_{tag}_{suffix}".replace("__", "_").strip("_") if tag else f"{first.lower()}_{suffix}"
    return username, f"{first} {last}", first


def seed_tier3(count: int, batch_size: int = 1000):
    db = get_supabase()
    for batch_start in tqdm(range(0, count, batch_size), desc="Tier 3"):
        batch = []
        for _ in range(min(batch_size, count - batch_start)):
            username, display, _ = turkish_name()
            batch.append({
                "username": username,
                "display_name": display,
                "avatar_seed": username,
                "tier": 3,
                "is_open": False,
                "follower_count": random.randint(0, 5000),
                "post_count": random.randint(0, 500),
            })
        db.table("fake_users").insert(batch).execute()


def seed_tier2(count: int, batch_size: int = 500):
    db = get_supabase()
    for batch_start in tqdm(range(0, count, batch_size), desc="Tier 2"):
        batch = []
        for _ in range(min(batch_size, count - batch_start)):
            username, display, _ = turkish_name()
            batch.append({
                "username": username,
                "display_name": display,
                "avatar_seed": username,
                "tier": 2,
                "is_open": False,
                "bio": random.choice(BIOS_T2),
                "follower_count": random.randint(500, 50000),
                "post_count": random.randint(1, 5),
                "is_verified": random.random() < 0.05,
            })
        db.table("fake_users").insert(batch).execute()


def seed_tier1(count: int):
    db = get_supabase()
    for char in tqdm(TIER1_HARDCODED, desc="Tier 1 hardcoded"):
        db.table("fake_users").insert({
            **char,
            "avatar_seed": char["username"],
            "tier": 1,
            "is_open": True,
            "follower_count": random.randint(10000, 500000),
            "post_count": random.randint(20, 200),
            "is_verified": char["personality_type"] == "brand" or random.random() < 0.3,
        }).execute()

    remaining = count - len(TIER1_HARDCODED)
    for i in tqdm(range(remaining), desc="Tier 1 generated"):
        username, display, first = turkish_name()
        personality = random.choice(EXTRA_PERSONALITIES)
        db.table("fake_users").insert({
            "username": username,
            "display_name": display,
            "avatar_seed": username,
            "tier": 1,
            "is_open": True,
            "personality_type": personality,
            "interests": random.choice(EXTRA_INTERESTS),
            "bio": f"Merhaba, ben {first}! ✨",
            "follower_count": random.randint(5000, 200000),
            "post_count": random.randint(10, 100),
            "is_verified": random.random() < 0.15,
        }).execute()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], required=True)
    parser.add_argument("--count", type=int, default=None)
    parser.add_argument("--batch", type=int, default=1000)
    args = parser.parse_args()

    defaults = {1: 200, 2: 4800, 3: 995000}
    count = args.count or defaults[args.tier]

    if args.tier == 3:
        seed_tier3(count, args.batch)
    elif args.tier == 2:
        seed_tier2(count, args.batch)
    else:
        seed_tier1(count)

    print("✅ Tamamlandı!")
