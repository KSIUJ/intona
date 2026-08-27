from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class ExerciseLogCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    exercise_id: int
    # exercise duration should be in seconds? or milliseconds? or some other unit of time?
    exercise_duration: int = Field(description="Exercise duration in seconds", ge=0)
    # should be in scale 0 - 100 % or in scale 0 - 1? I will assume scale 0 - 100%
    # we also need to specify exact scoring methods
    time_in_tune: float= Field(description="Time in tune in scale 0 - 100 %", ge=0, lt=100)
    average_deviation: float= Field(description="Average deviation in tune in scale 0 - 100 % (or not idk)", ge=0, lt=100)

class ExerciseLogResponse(ExerciseLogCreate):
    id: int 
    attempted_at: datetime
    attempting_user_id: int

class ExerciseAvailabilityLogInfo(BaseModel):
    log_id: int = Field(description="Exercise log id")
    secret_exercise_token: str = Field(description="Exercise secret token it is used to check if you hadn't ended exercise earlier, with this when you start exercise while logged in you don't to log in again when you're logged out during this exercise")