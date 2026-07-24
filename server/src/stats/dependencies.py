from datetime import datetime
from typing import Annotated

from fastapi import Depends
from sqlmodel import select

from src.database import get_db
from src.stats.models import UserStats


async def check_user_stats(user_id: int) -> UserStats:
    db = await anext(get_db())
    user_stats: UserStats = await db.exec(select(UserStats).where(UserStats.id == user_id))
    user_stats = user_stats.first()
    if (datetime.now().date() - user_stats.lastActivityDate.date()).days > 1:
        user_stats.currentStreak = 0
    return user_stats

async def actualize_user_stats(user_id: int) -> UserStats:
    db = await anext(get_db())
    user_stats: UserStats = await db.exec(select(UserStats).where(UserStats.id == user_id))
    user_stats = user_stats.first()

    currDate = datetime.now().date()
    if (currDate - user_stats.lastActivityDate.date()).days == 1:
        user_stats.currentStreak+=1
        user_stats.longestStreak = user_stats.longestStreak if user_stats.currentStreak < user_stats.longestStreak else user_stats.currentStreak
    elif (currDate - user_stats.lastActivityDate.date()).days > 1:
        user_stats.currentStreak=1
        user_stats.longestStreak = user_stats.longestStreak if user_stats.currentStreak < user_stats.longestStreak else user_stats.currentStreak

    user_stats.lastActivityDate = datetime.now()
    db.add(user_stats)
    await db.commit()
    await db.refresh(user_stats)

    return user_stats


CheckStats = Annotated[UserStats, Depends(check_user_stats)]
UpdateStats = Annotated[UserStats, Depends(actualize_user_stats)]


