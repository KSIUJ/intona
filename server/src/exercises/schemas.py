from pydantic import BaseModel


class ExerciseTypeInfo(BaseModel):
    id: int
    type: str

class ExerciseCreate(BaseModel):
    file_name: str
    type: int

class ExerciseInfo(BaseModel):
    id: int
    file_name: str
    exercise_type: ExerciseTypeInfo




