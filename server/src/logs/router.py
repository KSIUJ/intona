from fastapi import APIRouter, HTTPException, status
from src.auth.dependencies import CurrentUser
from src.database import SessionDep
from src.logs.models import ExerciseLogs
from src.logs.schemas import ExerciseLogCreate, ExerciseLogResponse
from src.exercises.models import Exercise

router = APIRouter()

@router.post("/", response_model=ExerciseLogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(session: SessionDep, 
                     log_data: ExerciseLogCreate, 
                     user: CurrentUser
                     ) -> ExerciseLogResponse:

    exercise = await session.get(Exercise, log_data.exercise_id)
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exercise with id {log_data.exercise_id} does not exist"
        )

    new_log = ExerciseLogs(
        **log_data.model_dump(),
        attempting_user_id=user.id
        )

    session.add(new_log)
    await session.commit()
    await session.refresh(new_log)

    return new_log