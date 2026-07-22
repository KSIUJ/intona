from pydantic import BaseModel, Field


class ExerciseTypePublic(BaseModel):
    id: int
    type: str

class ExerciseBase(BaseModel):
    id: int
    file_name: str
    path: str

class ExerciseCreate(ExerciseBase):
    type: int

class ExercisePublic(ExerciseBase):
    exercise_type: ExerciseTypePublic

