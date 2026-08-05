from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ExerciseLogCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exercise_id: int 
    exercise_duration: int
    time_in_tune: float
    average_deviation: float 

class ExerciseLogResponse(ExerciseLogCreate):
    id: int 
    attempted_at: datetime
    attempting_user_id: int 