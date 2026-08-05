from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Dict, Any, Optional

class AverageScoreByCategory(BaseModel):
    category: str
    score: int

class AverageScoreByCategories(BaseModel):
    categories: list[AverageScoreByCategory]
    
class UserStatsUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int 
    averageScore: float 
    averageScoreByCategory: Optional[Dict[str, Any]] = None
    currentStreak: int 
    longestStreak: int 
    masteredPercentage: float 
    exercisesCompleted: int 
    lastActivityDate: datetime