from sqlmodel import select, func
from sqlalchemy.orm.attributes import flag_modified

from src.exercises.models import Exercise
from src.logs.models import ExerciseLogs
from src.stats.models import UserStats
from src.stats.utils import actualize_user_streak
from src.database import get_db


async def add_exercise_result(user_id: int, exercise_log: ExerciseLogs):
    async for db in get_db():
        detailed_user_stats: UserStats = await db.exec(select(UserStats).where(UserStats.id == int(user_id)))
        detailed_user_stats = detailed_user_stats.first()
        detailed_user_stats.average_score = (detailed_user_stats.average_score * detailed_user_stats.exercises_completed + exercise_log.time_in_tune) / (detailed_user_stats.exercises_completed + 1)
        detailed_user_stats.exercises_completed += 1

        biggest_score = await db.exec(select(func.max(ExerciseLogs.time_in_tune)).where(ExerciseLogs.exercise_id == exercise_log.exercise_id).where(ExerciseLogs.attempting_user_id == int(user_id)))
        biggest_score = biggest_score.first()


        if (exercise_log.time_in_tune > 80 and (not biggest_score or biggest_score < 80)):
            mastered_count = await db.exec(select(func.count(ExerciseLogs.exercise_id.distinct())).where(ExerciseLogs.attempting_user_id == int(user_id)).where(ExerciseLogs.time_in_tune >= 80))
            mastered_count = mastered_count.first() + 1
            exercises_count = await db.exec(select(func.count(Exercise.id)))
            exercises_count = exercises_count.first()
            if exercises_count > 0:
                detailed_user_stats.mastered_percentage = mastered_count / exercises_count * 100

        exercise_query = await db.exec(select(Exercise).where(Exercise.id == exercise_log.exercise_id))
        exercise = exercise_query.one()
        category_type = str(exercise.exercise_type.type)

        category_scores = dict(detailed_user_stats.average_score_by_category or {})

        old_category_stats = category_scores.get(category_type,{"score": 0.0, "count": 0})
        old_category_score = old_category_stats["score"]
        old_category_count = old_category_stats["count"]

        new_category_count = old_category_count + 1
        new_category_score = (old_category_count * old_category_score + exercise_log.time_in_tune) / new_category_count

        category_scores[category_type] = {"score": new_category_score, "count": new_category_count}

        detailed_user_stats.average_score_by_category = category_scores
        detailed_user_stats.total_practice_time += exercise_log.exercise_duration

        # Without this, the column will not be updated
        flag_modified(detailed_user_stats, "average_score_by_category")

        await actualize_user_streak(detailed_user_stats, db)

        await db.commit()
        await db.refresh(detailed_user_stats)


