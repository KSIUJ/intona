from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Column, JSON, Relationship

if TYPE_CHECKING:
    from src.exercises.models import Exercise
    from src.auth.models import User

class UserStats(SQLModel, table=True):
    __tablename__ = "user_detailed_stats"
    id: int = Field(primary_key=True, foreign_key="users.id")
    average_score: float = Field(nullable=False)
    average_score_by_category: dict = Field(default_factory=dict, sa_column=Column(JSON),
                                            description="Average score by category, it looks like that {'Type': 'score', 'Type2': 'score2'}")
    current_streak: int = Field(nullable=False)
    longest_streak: int = Field(nullable=False)
    mastered_percentage: float = Field(nullable=False, description="Mastered percentage of all exercises in scale 0 - 100 %", ge=0, lt=100)
    exercises_completed: int = Field(nullable=False)
    total_practice_time: int = Field(nullable=False, description="Total time of practice in seconds")
    days_active: int = Field(nullable=False)
    last_activity_date: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    favorite_exercise: int | None = Field(foreign_key="exercises.id", description="Id of favorite exercise, favorite exercise is chosen through biggest count of successfully completed individual exercise")

    user: "User" = Relationship(back_populates="stats", sa_relationship_kwargs={"lazy": "selectin", "uselist": False})
    exercise: "Exercise" = Relationship(back_populates="stats", sa_relationship_kwargs={"lazy": "selectin", "uselist": False})





