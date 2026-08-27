from pydantic import BaseModel, HttpUrl, Field

from src.logs.enums import EndingStatusEnum
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
    slug: str
    difficulty: DifficultyEnum = Field("Exercise difficulty rating", examples=["Easy", "Medium", "Hard"])
    rating: int
    exercise_type: ExerciseTypeInfo = Field("Exercise type", examples=["Song", "Exercise"])

class ExerciseResult(BaseModel):
    exercise_duration: float = Field(description="Exercise duration in seconds", ge=0)
    time_in_tune: float = Field(description="Time in tune in scale 1-100%", ge=0, lt=100)
    average_deviation: float = Field(description="Average deviation in tune in scale 1-100%", ge=0, lt=100)
    exercise_end_status: EndingStatusEnum = Field(description="Ending status of exercise", examples=["Stopped","Exited"])

class ExerciseEndResult(BaseModel):
    exercise_duration: float = Field(description="Exercise duration in seconds, as persisted", ge=0)
    time_in_tune: float = Field(description="Time in tune in scale 0-100%, as persisted", ge=0, lt=100)
    average_deviation: float = Field(description="Average deviation in cents, as persisted", ge=0, lt=100)
    exercise_end_status: EndingStatusEnum = Field(description="Final status of the exercise log", examples=["Stopped", "Ended"])
    counted_toward_stats: bool = Field(description="True if this attempt updated the user's stats (average score, mastery, streak)")

class ExerciseDeleteInfo(BaseModel):
    secret_exercise_token: str = Field(description="It's secret token for this exercise, it is used for storing results of this exercise", examples=[""])

class TestingExerciseInfo(BaseModel):
    midi_file: HttpUrl = Field(description="MIDI file presigned_url",
                               examples=["https://storage_url/bucket_name/midi-test/audio.midi?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=tid_bdSHUPdTNWnJZlsZZrQL_uEYqcZErtEs_PgXhRb_tbfNJlglbW%2F20260818%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260818T095051Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=72ddc63e360101062ce6fa892dd1abbab3942dacd4eadc47e7117ba6882974b7"])
    xml_file: HttpUrl = Field(description="xml file presigned_url",
                               examples=["https://t3.storageapi.dev/exercise-audio-files-8bolos/midi-test/notes.musicxml?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=tid_bdSHUPdTNWnJZlsZZrQL_uEYqcZErtEs_PgXhRb_tbfNJlglbW%2F20260818%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260818T095051Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=fe81ec8d6c621baa78305fced19fb7427fe1bd2a0312b204da340857612c6462"])




