from pydantic import BaseModel, ConfigDict
from datetime import datetime

class AverageScoreByCategory(BaseModel):
    category: str
    score: int

class AverageScoreByCategories(BaseModel):
    categories: list[AverageScoreByCategory]
    
class UserStatsUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int 
    averageScore: float 
    averageScoreByCategory: list[dict]
    currentStreak: int 
    longestStreak: int 
    masteredPercentage: float 
    exercisesCompleted: int 
    lastActivityDate: datetime