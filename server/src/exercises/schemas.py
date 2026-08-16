from pydantic import BaseModel

from src.exercises.enums import DifficultyEnum


class ExerciseTypeInfo(BaseModel):
    id: int
    type: str

class ExerciseCreate(BaseModel):
    exercise_name: str
    type: int

class ExerciseBase(BaseModel):
    id: int
    exercise_name: str

class ExerciseInfo(ExerciseBase):
    difficulty: DifficultyEnum
    rating: int
    exercise_type: ExerciseTypeInfo




