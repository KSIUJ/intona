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
    # maybe i should commit this change to a database
    if (datetime.now().date() - user_stats.lastActivityDate.date()).days > 1:
        user_stats.currentStreak = 0
    return user_stats


CheckStats = Annotated[UserStats, Depends(check_user_stats)]


