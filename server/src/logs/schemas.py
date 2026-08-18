from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ExerciseLogCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exercise_id: int
    # exercise duration should be in seconds? or milliseconds? or some other unit of time?
    exercise_duration: int
    # should be in scale 0 - 100 % or in scale 0 - 1? I will assume scale 0 - 100%
    # we also need to specify exact scoring methods
    time_in_tune: float
    average_deviation: float 

class ExerciseLogResponse(ExerciseLogCreate):
    id: int 
    attempted_at: datetime
    attempting_user_id: int

class ExerciseAvailabilityLogInfo(BaseModel):
    log_id: int
    secret_exercise_token: str