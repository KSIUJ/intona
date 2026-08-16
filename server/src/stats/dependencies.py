from datetime import datetime, UTC
from typing import Annotated

from fastapi import Depends, HTTPException
from sqlmodel import select

from src.database import SessionDep
from src.stats.models import UserStats


async def check_user_stats(user_id: int, session: SessionDep) -> UserStats:
    user_stats: UserStats = await session.exec(select(UserStats).where(UserStats.id == user_id))
    user_stats = user_stats.first()
    if user_stats is None:
        raise HTTPException(status_code=404, detail="User not found")
    # maybe i should commit this change to a database
    if (datetime.now(UTC).date() - user_stats.last_activity_date.date()).days > 1:
        user_stats.currentStreak = 0
    return user_stats


CheckStats = Annotated[UserStats, Depends(check_user_stats)]


