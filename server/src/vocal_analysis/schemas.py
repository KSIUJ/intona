from pydantic import BaseModel, Field

class PerformedNoteInput(BaseModel):
    note_index: int = Field(description="Note index corresponding to the pattern from the database")
    detected_pitches: list[float] = Field(description="List of frequencies in Hz detected by Pitchy for a given note")

class ExerciseSubmission(BaseModel):
    exercise_id: int
    exercise_duration_s: int
    performed_notes: list[PerformedNoteInput]

class NoteScoreResult(BaseModel):
    note_index: int
    target_freq_hz: float
    score: float

class ExerciseEvaluationResponse(BaseModel):
    log_id: int
    exercise_id: int
    overall_score: float  # Assigned to time_in_tune (0–100%)
    average_cents_deviation: float
    exercise_duration_s: int
    notes_breakdown: list[NoteScoreResult]