import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as s:
        r = await s.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'posts' ORDER BY column_name"
            )
        )
        cols = [row[0] for row in r.all()]
        print("posts columns:", cols)
        print("on_explore:", "on_explore" in cols)
        print("explore_at:", "explore_at" in cols)


if __name__ == "__main__":
    asyncio.run(main())
