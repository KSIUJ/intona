from datetime import datetime

from sqlmodel import SQLModel, Field, Relationship



class ExerciseLogs(SQLModel, table=True):
    id: int = Field(primary_key=True)
    exercise_type: int = Field(nullable=False)
    exercise_name: str = Field(nullable=False)
    exercise_duration: int = Field(nullable=False)
    time_in_tune: float = Field(nullable=False)
    average_deviation: float = Field(nullable=False)
    attempted_at: datetime = Field(nullable=False)
    attempting_user_id: int = Field(nullable=False, foreign_key="users.id")

    user: "User" = Relationship(back_populates="logs")
