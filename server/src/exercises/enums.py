from enum import Enum

class DifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"

class ExerciseTypeEnum(str, Enum):
    SONG = "Song"
    EXERCISE = "Exercise"
