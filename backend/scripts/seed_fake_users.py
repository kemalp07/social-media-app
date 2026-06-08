"""
Vibe fake user seed script — Neon PostgreSQL via SQLAlchemy async.

Usage:
  python -m scripts.seed_fake_users --tier 1
  python -m scripts.seed_fake_users --tier 2 --count 4800
  python -m scripts.seed_fake_users --tier 3 --batch 1000
"""
import argparse
import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import func, select

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

TIER1_HARDCODED = [
    {"username": "ayse_fit", "display_name": "Ayşe Kaya", "personality_type": "friendly", "interests": ["fitness", "nutrition", "travel"], "bio": "Fitness & sağlıklı yaşam 💪"},
    {"username": "mert_photo", "display_name": "Mert Arslan", "personality_type": "cool", "interests": ["photography", "music", "coffee"], "bio": "Fotoğrafçı ☕"},
    {"username": "zeynep_mode", "display_name": "Zeynep Bal", "personality_type": "flirty", "interests": ["fashion", "beauty", "lifestyle"], "bio": "Moda & güzellik ✨"},
    {"username": "sponsor_spor", "display_name": "SportBrand TR", "personality_type": "brand", "interests": ["fitness", "sport"], "bio": "Resmi sponsorluk hesabı 🏆"},
    {"username": "hater_anon", "display_name": "anon_x99", "personality_type": "hater", "interests": [], "bio": "..."},
]


def turkish_name() -> tuple[str, str]:
    first = random.choice(ERKEK + KADIN)
    last = random.choice(SOYAD)
    suffix = random.randint(100, 9999)
    username = f"{first.lower()}_{suffix}"
    return username, f"{first} {last}"


async def seed_tier3(count: int, batch_size: int = 1000):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(func.count(FakeUser.id)).where(FakeUser.tier == 3))
        start = result.scalar() or 0

        for batch_start in tqdm(range(0, count, batch_size), desc="Tier 3"):
            batch = []
            for _ in range(min(batch_size, count - batch_start)):
                username, display = turkish_name()
                batch.append(FakeUser(
                    username=username, display_name=display, avatar_seed=username,
                    tier=3, is_open=False,
                    follower_count=random.randint(0, 5000),
                    post_count=random.randint(0, 500),
                ))
            session.add_all(batch)
            await session.commit()


async def seed_tier2(count: int, batch_size: int = 500):
    async with AsyncSessionLocal() as session:
        for batch_start in tqdm(range(0, count, batch_size), desc="Tier 2"):
            batch = []
            for _ in range(min(batch_size, count - batch_start)):
                username, display = turkish_name()
                batch.append(FakeUser(
                    username=username, display_name=display, avatar_seed=username,
                    tier=2, is_open=False, bio="Hayat güzel ✨",
                    follower_count=random.randint(500, 50000),
                    post_count=random.randint(1, 5),
                    is_verified=random.random() < 0.05,
                ))
            session.add_all(batch)
            await session.commit()


async def seed_tier1(count: int):
    async with AsyncSessionLocal() as session:
        for char in tqdm(TIER1_HARDCODED, desc="Tier 1 hardcoded"):
            session.add(FakeUser(
                username=char["username"], display_name=char["display_name"],
                avatar_seed=char["username"], tier=1, is_open=True,
                personality_type=char["personality_type"],
                interests=char["interests"], bio=char["bio"],
                follower_count=random.randint(10000, 500000),
                post_count=random.randint(20, 200),
                is_verified=char["personality_type"] == "brand",
            ))
        await session.commit()

        remaining = count - len(TIER1_HARDCODED)
        for _ in tqdm(range(remaining), desc="Tier 1 generated"):
            username, display = turkish_name()
            session.add(FakeUser(
                username=username, display_name=display, avatar_seed=username,
                tier=1, is_open=True, personality_type="friendly",
                interests=["fitness", "travel"], bio=f"Merhaba! ✨",
                follower_count=random.randint(5000, 200000),
                post_count=random.randint(10, 100),
            ))
        await session.commit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], required=True)
    parser.add_argument("--count", type=int, default=None)
    parser.add_argument("--batch", type=int, default=1000)
    args = parser.parse_args()

    defaults = {1: 200, 2: 4800, 3: 995000}
    count = args.count or defaults[args.tier]

    if args.tier == 3:
        asyncio.run(seed_tier3(count, args.batch))
    elif args.tier == 2:
        asyncio.run(seed_tier2(count, args.batch))
    else:
        asyncio.run(seed_tier1(count))

    print("✅ Tamamlandı!")
