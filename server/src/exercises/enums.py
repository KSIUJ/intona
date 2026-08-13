from enum import Enum

def enum_values(enum_class: type[Enum]) -> list:
    """Get values for enum."""
    return [status.value for status in enum_class]

class DifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"