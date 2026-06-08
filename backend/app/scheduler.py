from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.dm_service import initiate_bot_dms
from app.services.engagement_service import deliver_pending_likes
from app.services.growth_service import daily_fake_posts, organic_growth
from app.services.notification_service import send_daily_digest

scheduler = AsyncIOScheduler()


def setup_scheduler():
    scheduler.add_job(deliver_pending_likes, "interval", minutes=1, id="deliver_likes")
    scheduler.add_job(organic_growth, "interval", hours=1, id="organic_growth")
    scheduler.add_job(initiate_bot_dms, "cron", hour=10, id="daily_dm")
    scheduler.add_job(daily_fake_posts, "cron", hour=8, id="daily_fake_posts")
    scheduler.add_job(_daily_digest_all, "cron", hour=9, id="daily_digest")
    scheduler.start()


async def _daily_digest_all():
    from app.database import get_supabase

    db = get_supabase()
    users = db.table("users").select("id").execute()
    for user in users.data or []:
        await send_daily_digest(user["id"])
