from pydantic import BaseModel

from src.exercises.enums import DifficultyEnum


class ExerciseTypeInfo(BaseModel):
    id: int
    type: str

class ExerciseCreate(BaseModel):
    exercise_name: str
    type: int

class ExerciseInfo(BaseModel):
    id: int
    exercise_name: str
    difficulty: DifficultyEnum
    rating: int
    exercise_type: ExerciseTypeInfo




