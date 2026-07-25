from sqlmodel import select, func

from src.exercises.models import Exercise
from src.logs.models import ExerciseLogs
from src.stats.models import UserStats
from src.stats.utils import actualize_user_streak
from src.database import get_db


async def add_exercise_result(user_id: int, exerciseLog: ExerciseLogs):
    db = await anext(get_db())

    detailed_user_stats: UserStats = await db.exec(select(UserStats).where(UserStats.id == int(user_id)))
    detailed_user_stats = detailed_user_stats.first()
    detailed_user_stats.averageScore = (detailed_user_stats.averageScore * detailed_user_stats.exercisesCompleted + exerciseLog.time_in_tune) / (detailed_user_stats.exercisesCompleted + 1)
    detailed_user_stats.exercisesCompleted += 1

    biggest_score = await db.exec(select(func.max(ExerciseLogs.time_in_tune)).where(ExerciseLogs.exercise_id == exerciseLog.exercise_id).where(ExerciseLogs.attempting_user_id == int(user_id)))
    biggest_score = biggest_score.first()


    if (exerciseLog.time_in_tune > 80 and (not biggest_score or biggest_score < 80)):
        mastered_count = await db.exec(select(func.count(ExerciseLogs.exercise_id.distinct())).where(ExerciseLogs.attempting_user_id == int(user_id)).where(ExerciseLogs.time_in_tune >= 80))
        mastered_count = mastered_count.first() + 1
        exercises_count = await db.exec(select(func.count(Exercise.id)))
        exercises_count = exercises_count.first()
        detailed_user_stats.masteredPercentage = mastered_count / exercises_count * 100

    # count_by_category = await db.exec(select(func.count(ExerciseLogs)).where(ExerciseLogs.attempting_user_id == user_id).where(ExerciseLogs.exercise.type == exerciseLog.exercise.type))
    # count_by_category = count_by_category.first() + 1

    # tutaj musisz pomyśleć jak to zrobić aby załapało nam odpowiedni score odpowiedniego category
    # average_by_category = detailed_user_stats.averageScoreByCategory[id - 1 #exerciseLog.exercise.exercise_type.type]["score"]
    # tutaj musisz pomyśleć jak to zrobić aby załapało nam odpowiedni score odpowiedniego category
    # detailed_user_stats.averageScoreByCategory[tutaj daj id - 1 (bo zaczyna sie od zera)]["score"] = (average_by_category * (count_by_category - 1) + exerciseLog.time_in_tune) / (count_by_category)


    await actualize_user_streak(detailed_user_stats)


