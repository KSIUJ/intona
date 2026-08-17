from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Dict, Any, Optional

from src.exercises.schemas import ExerciseBase
from src.auth.schemas import UserPublic

class AverageScoreByCategory(BaseModel):
    category: str
    score: int

class AverageScoreByCategories(BaseModel):
    categories: list[AverageScoreByCategory]
    
class UserStatsUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic
    average_score: float
    average_score_by_category: Optional[Dict[str, Any]] = None
    current_streak: int
    longest_streak: int
    mastered_percentage: float
    exercises_completed: int
    total_practice_time: int
    days_active: int
    last_activity_date: datetime
    exercise: ExerciseBase | None
