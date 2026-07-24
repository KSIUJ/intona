from fastapi import APIRouter, HTTPException, status, Depends

from src.auth.dependencies import CurrentUser
from src.stats.dependencies import CheckStats
router = APIRouter()

@router.get("/{user_id}/stats")
async def get_stats(user: CurrentUser, user_id: int, stats: CheckStats ):
    if user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return stats