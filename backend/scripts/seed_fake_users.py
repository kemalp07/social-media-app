"""
Vibe fake user seed script — Neon PostgreSQL via SQLAlchemy async.

Usage:
  python -m scripts.seed_fake_users --tier 1
  python -m scripts.seed_fake_users --tier 2
  python -m scripts.seed_fake_users --tier 3
"""
import argparse
import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.database import AsyncSessionLocal
from app.models import FakeUser

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable

ERKEK = ["Ahmet", "Mehmet", "Ali", "Mustafa", "Emre", "Burak", "Can", "Murat", "Oğuz", "Kemal"]
KADIN = ["Ayşe", "Fatma", "Zeynep", "Elif", "Merve", "Selin", "Büşra", "Esra", "Gamze", "Hande"]
SOYAD = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Arslan", "Doğan", "Aydın", "Öztürk"]

PERSONALITIES = ["friendly", "cool", "flirty", "supportive", "curious", "energetic"]
INTERESTS_POOL = [
    ["fitness", "nutrition", "travel"],
    ["photography", "music", "coffee"],
    ["fashion", "beauty", "lifestyle"],
    ["food", "cooking", "restaurants"],
    ["tech", "gaming", "startups"],
    ["nature", "hiking", "camping"],
    ["books", "cinema", "art"],
    ["football", "basketball", "sport"],
]

TIER1_CHARACTERS = [
    {"username": "ayse_fit", "display_name": "Ayşe Kaya", "personality_type": "friendly", "interests": ["fitness", "nutrition", "travel"], "bio": "Fitness & sağlıklı yaşam 💪 Sabah koşuları, smoothie ve motivasyon."},
    {"username": "mert_photo", "display_name": "Mert Arslan", "personality_type": "cool", "interests": ["photography", "music", "coffee"], "bio": "Işığı yakalayan fotoğrafçı ☕ Şehir sokakları benim stüdyom."},
    {"username": "zeynep_mode", "display_name": "Zeynep Bal", "personality_type": "flirty", "interests": ["fashion", "beauty", "lifestyle"], "bio": "Moda & güzellik ✨ Kombin önerileri ve günlük ilham."},
    {"username": "sponsor_spor", "display_name": "SportBrand TR", "personality_type": "brand", "interests": ["fitness", "sport"], "bio": "Resmi sponsorluk hesabı 🏆 Sporun gücüne inanıyoruz."},
    {"username": "hater_anon", "display_name": "anon_x99", "personality_type": "hater", "interests": [], "bio": "..."},
    {"username": "elif_yoga", "display_name": "Elif Demir", "personality_type": "friendly", "interests": ["yoga", "wellness", "meditation"], "bio": "Nefes al, akışa bırak 🧘 Mindfulness ve denge."},
    {"username": "can_gezgin", "display_name": "Can Yıldız", "personality_type": "cool", "interests": ["travel", "photography", "food"], "bio": "Dünyayı gezen Türk 🌍 Her hafta yeni bir şehir."},
    {"username": "busra_mutfak", "display_name": "Büşra Öztürk", "personality_type": "friendly", "interests": ["cooking", "food", "family"], "bio": "Ev yapımı lezzetler 🍲 Anne tarifleri ve pratik mutfak."},
    {"username": "emre_tekno", "display_name": "Emre Şahin", "personality_type": "cool", "interests": ["tech", "gaming", "startups"], "bio": "Kod yazıyorum, oyun oynuyorum 🎮 Yeni nesil teknoloji."},
    {"username": "selin_kitap", "display_name": "Selin Aydın", "personality_type": "friendly", "interests": ["books", "cinema", "art"], "bio": "Kitap kurdu 📚 Ayda bir kitap, haftada bir film."},
    {"username": "burak_futbol", "display_name": "Burak Doğan", "personality_type": "cool", "interests": ["football", "sport", "fitness"], "bio": "Maç günü enerjisi ⚽ Tribün ve antrenman notları."},
    {"username": "merve_guzellik", "display_name": "Merve Çelik", "personality_type": "flirty", "interests": ["beauty", "skincare", "lifestyle"], "bio": "Cilt bakımı ve makyaj 💄 Doğal güzellik ipuçları."},
    {"username": "oguz_doga", "display_name": "Oğuz Kaya", "personality_type": "friendly", "interests": ["nature", "hiking", "camping"], "bio": "Dağlar benim evim 🏔️ Kamp ve trekking rotaları."},
    {"username": "hande_dans", "display_name": "Hande Yılmaz", "personality_type": "flirty", "interests": ["dance", "music", "fitness"], "bio": "Ritim tutkunu 💃 Dans ve hareket her gün."},
    {"username": "fatma_anne", "display_name": "Fatma Arslan", "personality_type": "friendly", "interests": ["family", "parenting", "food"], "bio": "Anne blogger 👶 Pratik ebeveynlik ve ev hayatı."},
    {"username": "kemal_muzik", "display_name": "Kemal Demir", "personality_type": "cool", "interests": ["music", "guitar", "concerts"], "bio": "Gitar ve akustik 🎸 Canlı performans ve playlist."},
    {"username": "esra_sanat", "display_name": "Esra Bal", "personality_type": "cool", "interests": ["art", "design", "museums"], "bio": "Sanat her yerde 🎨 Sergi ve illüstrasyon paylaşımları."},
    {"username": "murat_kahve", "display_name": "Murat Öztürk", "personality_type": "cool", "interests": ["coffee", "photography", "travel"], "bio": "Third wave kahve ☕ Çekirdek, demleme, mekan."},
    {"username": "gamze_moda", "display_name": "Gamze Şahin", "personality_type": "flirty", "interests": ["fashion", "shopping", "lifestyle"], "bio": "Trend avcısı 👗 Uygun fiyatlı stil önerileri."},
    {"username": "ahmet_yatirim", "display_name": "Ahmet Yıldız", "personality_type": "cool", "interests": ["finance", "tech", "startups"], "bio": "Finans ve girişimcilik 📈 Basit yatırım notları."},
]

TIER2_BIOS = [
    "Hayat güzel ✨",
    "Pozitif enerji 🌟",
    "Her gün yeni bir başlangıç",
    "Kendi yolumda ilerliyorum",
    "Paylaşmak güzeldir 💫",
    "İstanbul'dan sevgiler",
    "Anılar biriktiriyorum 📸",
    "Küçük mutluluklar peşinde",
    "Kendime zaman ayırıyorum",
    "Hayaller peşinde koşuyorum",
]


def turkish_name() -> tuple[str, str]:
    first = random.choice(ERKEK + KADIN)
    last = random.choice(SOYAD)
    suffix = random.randint(100, 9999)
    username = f"{first.lower()}_{suffix}"
    return username, f"{first} {last}"


def unique_username(base: str, taken: set[str]) -> str:
    candidate = base
    n = 1
    while candidate in taken:
        candidate = f"{base}{n}"
        n += 1
    taken.add(candidate)
    return candidate


async def seed_tier3(count: int, batch_size: int = 500):
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(FakeUser.username).where(FakeUser.tier == 3))
        taken = {row[0] for row in existing.all()}

        for batch_start in tqdm(range(0, count, batch_size), desc="Tier 3"):
            batch = []
            for _ in range(min(batch_size, count - batch_start)):
                username, _ = turkish_name()
                username = unique_username(username, taken)
                batch.append(FakeUser(
                    username=username,
                    avatar_seed=username,
                    tier=3,
                    is_open=False,
                ))
            session.add_all(batch)
            await session.commit()


async def seed_tier2(count: int):
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(FakeUser.username))
        taken = {row[0] for row in existing.all()}

        batch = []
        for i in tqdm(range(count), desc="Tier 2"):
            username, display = turkish_name()
            username = unique_username(username, taken)
            interests = INTERESTS_POOL[i % len(INTERESTS_POOL)]
            batch.append(FakeUser(
                username=username,
                display_name=display,
                avatar_seed=username,
                tier=2,
                is_open=False,
                personality_type=PERSONALITIES[i % len(PERSONALITIES)],
                interests=interests,
                bio=TIER2_BIOS[i % len(TIER2_BIOS)],
                follower_count=random.randint(500, 50000),
                post_count=random.randint(1, 50),
                is_verified=random.random() < 0.05,
            ))
        session.add_all(batch)
        await session.commit()


async def seed_tier1():
    async with AsyncSessionLocal() as session:
        for char in tqdm(TIER1_CHARACTERS, desc="Tier 1"):
            stmt = insert(FakeUser).values(
                username=char["username"],
                display_name=char["display_name"],
                avatar_seed=char["username"],
                tier=1,
                is_open=True,
                personality_type=char["personality_type"],
                interests=char["interests"],
                bio=char["bio"],
                follower_count=random.randint(10000, 500000),
                post_count=random.randint(20, 200),
                is_verified=char["personality_type"] == "brand",
            ).on_conflict_do_nothing(index_elements=["username"])
            await session.execute(stmt)
        await session.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], required=True)
    parser.add_argument("--count", type=int, default=None)
    parser.add_argument("--batch", type=int, default=500)
    args = parser.parse_args()

    defaults = {1: 20, 2: 100, 3: 1000}
    count = args.count or defaults[args.tier]

    if args.tier == 3:
        asyncio.run(seed_tier3(count, args.batch))
    elif args.tier == 2:
        asyncio.run(seed_tier2(count))
    else:
        asyncio.run(seed_tier1())

    print("Tamamlandi!")
