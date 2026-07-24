from pydantic import BaseModel, Field


class ExerciseTypePublic(BaseModel):
    id: int
    type: str

class ExerciseBase(BaseModel):
    file_name: str
    path: str

class ExerciseCreate(ExerciseBase):
    type: int

class ExercisePublic(ExerciseBase):
    id: int
    exercise_type: ExerciseTypePublic

