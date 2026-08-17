
from typing import TYPE_CHECKING

from sqlalchemy import Column
from sqlmodel import Field, Relationship, SQLModel, Enum as SQLModelEnum

from src.exercises.enums import DifficultyEnum, enum_values


if TYPE_CHECKING:
    from src.logs.models import ExerciseLogs
    from src.stats.models import UserStats

class ExerciseType(SQLModel, table=True):
    __tablename__ = "exercise_types"
    id: int | None = Field(default=None, primary_key=True)
    type: str = Field(nullable=False, unique=True)

    exercises: list["Exercise"] = Relationship(back_populates="exercise_type", sa_relationship_kwargs={"lazy": "selectin"},)


class Exercise(SQLModel, table=True):
    __tablename__ = "exercises"
    id: int | None = Field(default=None, primary_key=True)
    exercise_name: str = Field(nullable=False, unique=True)
    slug: str = Field(nullable=False)
    difficulty: DifficultyEnum = Field(sa_column=Column(
            nullable=False,
            type_= SQLModelEnum(DifficultyEnum, values_callable=enum_values, name="difficulty"),

        ))
    exercise_duration: int = Field(nullable=False, default=0)
    rating: int = Field(nullable=False, default=0)
    type: int = Field(nullable=False, foreign_key="exercise_types.id")


    stats: list["UserStats"] = Relationship(back_populates="exercise", sa_relationship_kwargs={"lazy": "raise"})
    exercise_type: ExerciseType = Relationship(back_populates="exercises", sa_relationship_kwargs={"lazy": "selectin"})
    exercise_logs: list["ExerciseLogs"] = Relationship(back_populates="exercise", sa_relationship_kwargs={"lazy": "selectin"})

class ProcessExercise(SQLModel, table=True):
    __tablename__ = "task_queue"
    id: int | None = Field(default=None, primary_key=True)
    exercise_name: str = Field(nullable=False)
    exercise_path: str = Field(nullable=False)
    exercise_id: int = Field(default=None)
    # when i have time and patience i can think about enums etc.
    status: str = Field(nullable=False, default=None)



