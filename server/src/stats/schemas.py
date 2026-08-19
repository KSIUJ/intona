from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Dict, Any, Optional

from src.exercises.schemas import ExerciseBase
from src.auth.schemas import UserPublic

class UserStatsUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic = Field(description="User who owns this exercise, encoded in JSON format", examples=["{'id': 1, 'username': 'john', 'joined_at': 2026-08-16 03:49:15}", "{'id': 2, 'username': 'john', joined_at: 2026-08-16 07:16:19}"])
    average_score: float = Field(description="Average score of all exercises")
    average_score_by_category: Optional[Dict[str, Any]] = Field(default=None, description="JSON encoded data about score by every category", examples=["""
    {
        "Song": {
            "score": 0,
            "count": 0
        },
        "Exercise": {
            "score": 50.56962571699734,
            "count": 21
        }
    }
    """])
    current_streak: int = Field(description="Current daily streak")
    longest_streak: int = Field(description="Longest daily streak")
    mastered_percentage: float = Field(description="Master percentage score of whole exercises in scale: 0 - 100%", ge=0, lt=100)
    exercises_completed: int
    total_practice_time: int = Field(description="Total time of practice in seconds")
    days_active: int
    last_activity_date: datetime
    exercise: ExerciseBase | None = Field(description="Current favorite exercise, encoded in JSON format", examples=["""
        {
            "id": 1,
            "exercise": exercise_name
        }
        """])
