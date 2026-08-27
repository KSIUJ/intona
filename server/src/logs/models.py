
from datetime import datetime, UTC
from sqlalchemy import DateTime, Column
from sqlmodel import SQLModel, Field, Relationship, Enum as SQLModelEnum

from typing import TYPE_CHECKING

from src.logs.enums import EndingStatusEnum
from src.utils import enum_values

if TYPE_CHECKING:
    from src.auth.models import User
    from src.exercises.models import Exercise



class ExerciseLogs(SQLModel, table=True):
    __tablename__ = "exercise_logs"
    id: int | None = Field(default=None, primary_key=True)
    exercise_id: int = Field(foreign_key="exercises.id")
    exercise_duration: int = Field(nullable=False, ge=0)
    time_in_tune: float = Field(nullable=False, ge=0, lt=100)
    average_deviation: float = Field(nullable=False, ge=0, lt=100)
    attempted_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    ended_at: datetime | None = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    attempting_user_id: int = Field(nullable=False, foreign_key="users.id")
    # description="Ending status of the exercise: current Ending Statutes -> Stopped, Ended, Ongoing")
    status: EndingStatusEnum = Field(
        description="Ending status of the exercise: current Ending Statutes -> Stopped, Ended, Ongoing",
        sa_column=Column(
            nullable=False,
            type_= SQLModelEnum(EndingStatusEnum, values_callable=enum_values, name="ending_status"),
    ))

    user: "User" = Relationship(back_populates="logs")
    exercise: "Exercise" = Relationship(back_populates="exercise_logs", sa_relationship_kwargs={"lazy": "selectin"})

