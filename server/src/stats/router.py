from fastapi import APIRouter, HTTPException, status, Depends

from src.auth.dependencies import CurrentUser
from src.stats.dependencies import CheckStats
from src.stats.schemas import UserStatsUserResponse
router = APIRouter()

@router.get("/{user_id}/stats", response_model=UserStatsUserResponse)
async def get_stats(user: CurrentUser, user_id: int, stats: CheckStats ):
    if user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return stats