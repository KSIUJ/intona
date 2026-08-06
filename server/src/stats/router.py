from fastapi import APIRouter, HTTPException, status, Depends

from src.auth.dependencies import CurrentUser
from src.stats.dependencies import CheckStats
from src.stats.schemas import UserStatsUserResponse
router = APIRouter()

@router.get("/{user_id}/stats", response_model=UserStatsUserResponse)
async def get_stats(user: CurrentUser, user_id: int, stats: CheckStats ):
    """
    Get detailed stats for a user

    ### Parameters:
    * **token**: `str` -> token should be typed into authorization header
    * **user_id**: `int` -> id of user to get stats for

    ### Returns:
    **UserStats** object encoded in JSON

    **HTTP STATUS 403** -> If you want to access not your stats
    """
    if user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return stats