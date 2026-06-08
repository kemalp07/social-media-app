"""
Seed fake users into Supabase.
Tier 3: 995,000 (batch insert, minimal fields)
Tier 2: 4,800
Tier 1: 200 (full characters)

Usage: python -m scripts.seed_fake_users --tier 3 --batch 10000
"""
import argparse
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_supabase

TIER1_PERSONALITIES = [
    "warm_supportive", "witty_sarcastic", "artsy_mysterious", "sporty_competitive",
    "foodie_enthusiast", "travel_wanderer", "fashion_forward", "tech_nerd",
    "music_lover", "bookworm_intellectual", "fitness_motivator", "comedy_king",
]

TIER1_INTERESTS = [
    ["photography", "travel", "coffee"],
    ["fitness", "health", "yoga"],
    ["fashion", "beauty", "lifestyle"],
    ["music", "concerts", "vinyl"],
    ["food", "cooking", "restaurants"],
    ["gaming", "tech", "anime"],
    ["art", "design", "museums"],
    ["sports", "basketball", "running"],
    ["books", "writing", "poetry"],
    ["nature", "hiking", "camping"],
]

FIRST_NAMES = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
    "Isabella", "Lucas", "Mia", "Oliver", "Charlotte", "Elijah", "Amelia",
    "James", "Harper", "Benjamin", "Evelyn", "Sebastian", "Luna", "Jack",
    "Camila", "Henry", "Penelope", "Leo", "Aria", "Daniel", "Chloe", "Mateo",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Moore",
    "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark", "Lewis",
]


def generate_username(tier: int, index: int) -> str:
    if tier == 3:
        return f"u{index:07d}"
    first = random.choice(FIRST_NAMES).lower()
    last = random.choice(LAST_NAMES).lower()
    suffix = random.randint(1, 999)
    return f"{first}_{last}{suffix}"


def seed_tier3(count: int, batch_size: int = 5000):
    db = get_supabase()
    existing = db.table("fake_users").select("id", count="exact").eq("tier", 3).execute()
    start_index = existing.count or 0

    for batch_start in range(0, count, batch_size):
        batch = []
        for i in range(batch_start, min(batch_start + batch_size, count)):
            idx = start_index + i
            username = generate_username(3, idx)
            batch.append({
                "username": username,
                "avatar_seed": username,
                "tier": 3,
                "is_open": False,
            })
        db.table("fake_users").insert(batch).execute()
        print(f"Tier 3: inserted {batch_start + len(batch)}/{count}")


def seed_tier2(count: int, batch_size: int = 500):
    db = get_supabase()
    for batch_start in range(0, count, batch_size):
        batch = []
        for i in range(batch_start, min(batch_start + batch_size, count)):
            username = generate_username(2, i)
            display = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            batch.append({
                "username": username,
                "display_name": display,
                "avatar_seed": username,
                "tier": 2,
                "is_open": True,
                "bio": random.choice([
                    "Living my best life ✨", "Coffee & sunsets ☕", "Just vibing",
                    "Creating memories", "Adventure seeker", "Dream big",
                ]),
                "follower_count": random.randint(500, 50000),
                "post_count": random.randint(1, 5),
                "is_verified": random.random() < 0.05,
            })
        db.table("fake_users").insert(batch).execute()
        print(f"Tier 2: inserted {batch_start + len(batch)}/{count}")


def seed_tier1(count: int):
    db = get_supabase()
    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        username = f"{first.lower()}_{last.lower()}{random.randint(1, 99)}"
        personality = random.choice(TIER1_PERSONALITIES)
        interests = random.choice(TIER1_INTERESTS)

        bios = {
            "warm_supportive": f"Hey, I'm {first}! Always here to hype you up 💕",
            "witty_sarcastic": f"{first} | Professional overthinker | DM for bad jokes",
            "artsy_mysterious": "creating worlds through lens and light ✦",
            "sporty_competitive": f"🏆 Athlete | {first} | Never backing down",
            "foodie_enthusiast": f"🍕 {first} | If I didn't post it, I didn't eat it",
        }

        db.table("fake_users").insert({
            "username": username,
            "display_name": f"{first} {last}",
            "avatar_seed": username,
            "tier": 1,
            "is_open": True,
            "personality_type": personality,
            "interests": interests,
            "bio": bios.get(personality, f"Hi, I'm {first}!"),
            "follower_count": random.randint(10000, 500000),
            "post_count": random.randint(20, 200),
            "is_verified": random.random() < 0.3,
        }).execute()
        print(f"Tier 1: inserted {i + 1}/{count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], required=True)
    parser.add_argument("--count", type=int, default=None)
    parser.add_argument("--batch", type=int, default=5000)
    args = parser.parse_args()

    defaults = {1: 200, 2: 4800, 3: 995000}
    count = args.count or defaults[args.tier]

    if args.tier == 3:
        seed_tier3(count, args.batch)
    elif args.tier == 2:
        seed_tier2(count, args.batch)
    else:
        seed_tier1(count)

    print("Done!")
