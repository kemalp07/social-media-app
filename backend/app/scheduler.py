import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database import AsyncSessionLocal
from app.services.dm_service import initiate_bot_dms
from app.services.engagement_service import run_like_engagement
from app.services.growth_service import daily_fake_posts, passive_growth
from app.services.notification_service import send_daily_digest

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(
    job_defaults={
        "coalesce": True,
        "max_instances": 1,
        "misfire_grace_time": 30,
    }
)


def setup_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(_deliver_likes, "interval", seconds=2, id="deliver_likes", replace_existing=True)
    scheduler.add_job(_passive_growth, "interval", seconds=1, id="passive_growth", replace_existing=True)
    scheduler.add_job(_daily_dm, "cron", hour=10, id="daily_dm", replace_existing=True)
    scheduler.add_job(_daily_fake_posts, "cron", hour=8, id="daily_fake_posts", replace_existing=True)
    scheduler.add_job(_daily_digest_all, "cron", hour=9, id="daily_digest", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler started")


def shutdown_scheduler():
    if not scheduler.running:
        return
    scheduler.shutdown(wait=True)
    logger.info("Scheduler stopped")


async def _deliver_likes():
    async with AsyncSessionLocal() as session:
        try:
            result = await run_like_engagement(session)
            await session.commit()
            if result["total"] > 0:
                logger.debug(
                    "Like engagement: +%d (scheduled=%d passive=%d)",
                    result["total"],
                    result["scheduled"],
                    result["passive"],
                )
        except asyncio.CancelledError:
            await session.rollback()
            logger.debug("Like engagement job cancelled")
        except Exception:
            await session.rollback()
            logger.exception("Like engagement job failed")


async def _passive_growth():
    async with AsyncSessionLocal() as session:
        try:
            total = await passive_growth(session)
            await session.commit()
            if total > 0:
                logger.debug("Passive growth drip: +%d follower(s)", total)
        except asyncio.CancelledError:
            await session.rollback()
            logger.debug("Passive growth job cancelled")
        except Exception:
            await session.rollback()
            logger.exception("Passive growth job failed")


async def _daily_dm():
    async with AsyncSessionLocal() as session:
        await initiate_bot_dms(session)
        await session.commit()


async def _daily_fake_posts():
    async with AsyncSessionLocal() as session:
        await daily_fake_posts(session)
        await session.commit()


async def _daily_digest_all():
    from sqlalchemy import select
    from app.models import User

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User.id))
        for (user_id,) in result.all():
            await send_daily_digest(session, user_id)
        await session.commit()
