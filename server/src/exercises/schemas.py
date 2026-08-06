from pydantic import BaseModel


class ExerciseTypeInfo(BaseModel):
    id: int
    type: str

class ExerciseCreate(BaseModel):
    exercise_name: str
    type: int

class ExerciseInfo(BaseModel):
    id: int
    exercise_name: str
    exercise_type: ExerciseTypeInfo




