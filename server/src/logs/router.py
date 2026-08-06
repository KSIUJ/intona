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
    """
    Creates a new exercise log

    ### Parameters:
    * **token**: `str` -> token, should be typed into authentication header
    * **exercise_id**: `int` -> id of exercise which log is to be created
    * **exercise_duration**: `int` -> duration of exercise in milliseconds
    * **time_in_tune**: `float` -> percent of our exercise completion
    * **average_deviation**: `float` -> average deviation of exercise

    ### Returns:
    **ExerciseLogResponse** encoded in JSON with Fields mentioned below:
    * **id**: `int` -> id of exercise log
    * **attempted_at**: `datetime` -> datetime of when the exercise was attempted
    * **attempting_user_id**: `int` -> id of user who attempted the exercise

    **HTTP STATUS 404**: Exercise with specified id does not exist
    """

    # should we change this to session.exec(select(Exercise).where(Exercise.id == log_data.exercise_id))
    # or maybe we should change every other query with this format to session.get...?
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