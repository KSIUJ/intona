from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from src.database import get_db
from src.stats.models import UserStats

# it will be called when exercise is completed
async def actualize_user_streak(user_stats: UserStats, db: AsyncSession) -> UserStats:
    currDate = datetime.now().date()
    if (currDate - user_stats.lastActivityDate.date()).days == 1:
        user_stats.currentStreak+=1
        user_stats.longestStreak = user_stats.longestStreak if user_stats.currentStreak < user_stats.longestStreak else user_stats.currentStreak
    elif (currDate - user_stats.lastActivityDate.date()).days > 1:
        user_stats.currentStreak=1
        user_stats.longestStreak = user_stats.longestStreak if user_stats.currentStreak < user_stats.longestStreak else user_stats.currentStreak

    user_stats.lastActivityDate = datetime.now()
    db.add(user_stats)

    return user_stats