"""Takipçi–beğeni oranları — tek kaynak, Instagram-benzeri eğri."""
import random

from app.config import settings

# Tick aralığı (scheduler): engagement_service.run_like_engagement → 2 sn
LIKE_TICK_SECONDS = 2
TICKS_PER_DAY = 86_400 // LIKE_TICK_SECONDS


def _fc(follower_count: int) -> int:
    return max(follower_count, 10)


def quality_engagement_multiplier(quality_score: float) -> float:
    """
    Kalite çarpanı — 10'da sert sıçrama (beğeni/yorum/takipçi kazancı).
    7 ≈ 1x | 9 ≈ 2x | 9.5 ≈ 2.8x | 10 ≈ 4x
    """
    score = min(10.0, max(1.0, float(quality_score)))
    if score >= 10.0:
        return 4.0
    if score >= 9.5:
        return 2.8
    if score >= 9.0:
        return 2.0
    if score >= 8.0:
        return 1.35
    if score >= 7.0:
        return 1.0
    if score >= 5.0:
        return 0.65
    return 0.35


def post_like_ratio_range(follower_count: int, quality_score: float) -> tuple[float, float]:
    """
    Post başına beğeni / takipçi oranı.
    Büyük hesaplarda % düşer (gerçekçi engagement eğrisi).
    """
    fc = _fc(follower_count)

    if fc >= 100_000:
        base = (0.008, 0.018)
    elif fc >= 10_000:
        base = (0.020, 0.045)
    elif fc >= 1_000:
        base = (0.032, 0.070)
    else:
        base = (0.045, 0.100)

    if quality_score >= 9:
        mult = (1.20, 1.40)
    elif quality_score >= 7:
        mult = (0.95, 1.10)
    elif quality_score >= 5:
        mult = (0.60, 0.80)
    else:
        mult = (0.30, 0.50)

    boost = quality_engagement_multiplier(quality_score)
    return base[0] * mult[0] * boost, base[1] * mult[1] * boost


def target_likes_for_post(
    follower_count: int,
    quality_score: float,
    *,
    is_premium: bool = False,
    is_viral: bool = False,
) -> int:
    lo, hi = post_like_ratio_range(follower_count, quality_score)
    ratio = random.uniform(lo, hi)
    fc = _fc(follower_count)
    target = int(fc * ratio)

    # Minimum: takipçinin ~%0.8'i (çok küçük postlar boş kalmasın)
    target = max(max(3, int(fc * 0.008)), target)

    if is_viral:
        target = int(target * random.uniform(3.0, 5.5))

    if is_premium:
        target = int(target * 1.30)

    if quality_score >= 10:
        cap_pct = 0.40
    elif quality_score >= 9.5:
        cap_pct = 0.28
    elif is_viral:
        cap_pct = 0.30
    else:
        cap_pct = 0.12
    cap = int(fc * cap_pct)
    return min(max(target, 3), max(cap, 3))


def follower_gain_for_post(
    follower_count: int,
    quality_score: float,
    *,
    is_premium: bool = False,
) -> int:
    """Post sonrası takipçi artışı — mevcut kitleye orantılı."""
    fc = _fc(follower_count)

    if quality_score >= 10:
        pct = random.uniform(0.008, 0.015)
    elif quality_score >= 9.5:
        pct = random.uniform(0.005, 0.009)
    elif quality_score >= 9:
        pct = random.uniform(0.0025, 0.006)
    elif quality_score >= 7:
        pct = random.uniform(0.0010, 0.0035)
    elif quality_score >= 5:
        pct = random.uniform(0.0004, 0.0012)
    else:
        pct = random.uniform(0.0001, 0.0005)

    gain = max(1, int(fc * pct))

    if is_premium:
        gain = int(gain * 1.4)

    max_pct = 0.025 if quality_score >= 10 else 0.012
    return min(gain, max(3, int(fc * max_pct)))


def daily_passive_like_budget(follower_count: int) -> float:
    """
    Eski postlara günlük arka plan beğeni bütçesi (takipçi oranı).
    Örnek 10K takipçi → ~120–180 beğeni/gün katalog geneline.
    """
    fc = _fc(follower_count)

    if fc >= 100_000:
        ratio = random.uniform(0.004, 0.007)
    elif fc >= 10_000:
        ratio = random.uniform(0.010, 0.016)
    elif fc >= 1_000:
        ratio = random.uniform(0.014, 0.022)
    else:
        ratio = random.uniform(0.020, 0.035)

    budget = fc * ratio

    if settings.environment == "development":
        budget *= 2.0

    # Çok küçük hesaplarda da hafif aktivite
    floor = 12.0 if settings.environment == "development" else 5.0
    return max(budget, floor)


def passive_like_tick_probability(follower_count: int) -> float:
    """2 sn tick başına arka plan beğeni olasılığı."""
    budget = daily_passive_like_budget(follower_count)
    prob = budget / TICKS_PER_DAY
    return max(0.0004, min(0.15, prob))


def expected_post_likes(follower_count: int, quality_score: float = 7.0) -> tuple[int, int]:
    """Debug / test — beklenen post beğeni aralığı."""
    lo, hi = post_like_ratio_range(follower_count, quality_score)
    fc = _fc(follower_count)
    return max(3, int(fc * lo)), max(3, int(fc * hi))


EXPLORE_MIN_SCORE = 8.5


def qualifies_for_explore(quality_score: float, engagement_prediction: str | None) -> bool:
    """
    AI kalite skoruna göre Keşfet adayı.
    >= 9.0: her zaman | >= 8.5 + high/viral: her zaman | >= 8.5: %50 şans
    """
    score = float(quality_score)
    prediction = (engagement_prediction or "medium").lower()

    if score >= 9.0:
        return True
    if score >= EXPLORE_MIN_SCORE and prediction in ("high", "viral"):
        return True
    if score >= EXPLORE_MIN_SCORE:
        return random.random() < 0.50
    return False
