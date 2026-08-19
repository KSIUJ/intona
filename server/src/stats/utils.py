import logging
from datetime import datetime, UTC
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func

from src.logs.enums import EndingStatusEnum
from src.logs.models import ExerciseLogs
from src.stats.models import UserStats

logging.basicConfig(level=logging.INFO)

# it will be called when exercise is completed
async def actualize_user_streak(user_stats: UserStats, db: AsyncSession) -> UserStats:
    currDate = datetime.now(UTC).date()
    if (currDate - user_stats.last_activity_date.date()).days == 1:
        user_stats.current_streak+=1
        user_stats.longest_streak = user_stats.longest_streak if user_stats.current_streak < user_stats.longest_streak else user_stats.current_streak
        user_stats.days_active += 1
    elif (currDate - user_stats.last_activity_date.date()).days > 1:
        user_stats.current_streak=1
        user_stats.longest_streak = user_stats.longest_streak if user_stats.current_streak < user_stats.longest_streak else user_stats.current_streak
        user_stats.days_active += 1

    user_stats.last_activity_date = datetime.now(UTC)

    db.add(user_stats)
    await db.commit()
    await db.refresh(user_stats)

    return user_stats

async def update_favorite_exercise(user_stats: UserStats, exercise_id: int, db: AsyncSession):
    exercise_count = await db.exec(select(func.count(ExerciseLogs.id)).where(ExerciseLogs.attempting_user_id==user_stats.id).where(ExerciseLogs.exercise_id==exercise_id).where(ExerciseLogs.status == EndingStatusEnum.ENDED))
    exercise_count = exercise_count.all()

    if user_stats.favorite_exercise is None:
        user_stats.favorite_exercise = exercise_id
        db.add(user_stats)
        await db.commit()
    else:
        favorite_id = user_stats.exercise.id
        if favorite_id != exercise_id:
            favorite_count = await db.exec(select(func.count(ExerciseLogs.id)).where(ExerciseLogs.attempting_user_id==user_stats.id).where(ExerciseLogs.exercise_id==favorite_id))
            favorite_count = favorite_count.one()

            if favorite_count < exercise_count[0]:
                user_stats.favorite_exercise = exercise_id
                db.add(user_stats)
                await db.commit()


