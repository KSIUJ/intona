from pydantic import BaseModel

class AverageScoreByCategory(BaseModel):
    category: str
    score: int

class AverageScoreByCategories(BaseModel):
    categories: list[AverageScoreByCategory]
    