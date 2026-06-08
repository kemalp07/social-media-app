from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.dm_service import initiate_bot_dms
from app.services.follower_service import passive_follower_growth
from app.services.like_service import deliver_pending_likes
from app.services.notification_service import send_daily_digest

scheduler = AsyncIOScheduler()


def setup_scheduler():
    # Deliver scheduled likes every minute
    scheduler.add_job(deliver_pending_likes, "interval", minutes=1, id="deliver_likes")

    # Passive follower growth every hour
    scheduler.add_job(passive_follower_growth, "interval", hours=1, id="passive_growth")

    # Tier 1 bots initiate DMs once daily at 10:00
    scheduler.add_job(initiate_bot_dms, "cron", hour=10, id="bot_dms")

    # Daily digest at 9:00
    scheduler.add_job(_daily_digest_all, "cron", hour=9, id="daily_digest")

    scheduler.start()


async def _daily_digest_all():
    from app.database import get_supabase

    db = get_supabase()
    users = db.table("users").select("id").execute()
    for user in users.data or []:
        await send_daily_digest(user["id"])
