from datetime import datetime
from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Column, JSON, Relationship

from src.auth.models import User

class UserStats(SQLModel, table=True):
    __tablename__ = "user_detailed_stats"
    id: int = Field(primary_key=True, foreign_key="users.id")
    averageScore: float = Field(nullable=False)
    averageScoreByCategory: dict = Field(default_factory=dict, sa_column=Column(JSON))
    currentStreak: int = Field(nullable=False)
    longestStreak: int = Field(nullable=False)
    masteredPercentage: float = Field(nullable=False)
    exercisesCompleted: int = Field(nullable=False)
    lastActivityDate: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))

    user: User = Relationship(back_populates="stats", sa_relationship_kwargs={"lazy": "selectin", "uselist": False})






