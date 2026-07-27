from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship




class ExerciseLogs(SQLModel, table=True):
    __tablename__ = "exercise_logs"
    id: int | None = Field(default=None, primary_key=True)
    exercise_id: int = Field(foreign_key="exercises.id")
    exercise_duration: int = Field(nullable=False)
    time_in_tune: float = Field(nullable=False)
    average_deviation: float = Field(nullable=False)
    attempted_at: datetime = Field(
        default_factory=datetime.now,
        nullable=False
    )
    attempting_user_id: int = Field(nullable=False, foreign_key="users.id")

    user: "User" = Relationship(back_populates="logs")
    exercise: "Exercise" = Relationship(back_populates="exercise_logs", sa_relationship_kwargs={"lazy": "selectin"})

