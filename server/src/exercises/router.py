import json
import logging
from fastapi import APIRouter, HTTPException, Form
from sqlmodel import select

from src.exercises.enums import ExerciseTypeEnum
from src.auth.dependencies import CurrentUser
from src.config import settings
from src.database import SessionDep
from src.exercises.models import Exercise, ExerciseType
from src.exercises.schemas import ExerciseInfo
from src.exercises.utils import request_access, register_exercise, check_exercise_availability
from src.services.s3_bucket import bucket_client

router = APIRouter()

logging.basicConfig(level=logging.INFO)


# when im done testing I need to put detailed exercise info as a response model


@router.get("", response_model=list[ExerciseInfo])
async def get_exercises(session: SessionDep):
    """
    Returns a list of all available exercises

    **Single Exercise consists of:**
    * **id:** `int` -> auto incrementing id of exercise
    * **exercise_name:** `str` -> name of exercise
    * **type:** `int` -> type of exercise, current id's references to:
      * 1 -> sustained note
      * 2 -> simple interval
      * 3 -> short melody
    * **processed:** `bool` -> True if exercise was processed by worker

    *returns* **ExerciseInfo** which consists of:
    * **id:** `int` -> id of exercise
    * **exercise_name:** `str` -> name of exercise
    * **exercise_type:** `str` -> string representation of type, current members are mentioned above
    """
    exercises = await session.exec(select(Exercise))
    return exercises.all()

# for now it should be Songs/Exercise
@router.get("/list/{exercise_type}")
async def get_exercises_by_category(session: SessionDep, exercise_type: ExerciseTypeEnum ):
    exercises_by_type = await session.exec(select(Exercise).join(ExerciseType).where(ExerciseType.type == exercise_type))
    return exercises_by_type.all()


# some day i will check exact error type, but for now Exception type will be enough
@router.get("/available/{exercise_name}")
async def check_availability(session: SessionDep, user: CurrentUser, exercise_name: str):
    """
    Checks whether there is a duplicate of this exercise

    ### Needed params:
    * **exercise_name**: `str` -> name of exercise


    ### Returns:
    * **HTTP STATUS 409:** Conflict if there is a duplicate exercise
    * **HTTP STATUS 200:** If you can send exercise to processing
    """
    await check_exercise_availability(session, exercise_name)


@router.get("/request-access")
async def request_exercise_access(session: SessionDep):
    """
    Returns a presigned post (an URL that can enable upload of chosen file)

    To upload file you need to provide url in request and (i think) other parameters which
    you get from this endpoint

    ### Returns:
    json data formatted as:
    ```json
    {
        "url": "url to our bucket",
        "fields" : {
            "key": "destination path, also can use placeholder ${filename} which sets our destination to hard_coded_path/{filename}",
            "x-amz-algorithm": "The cryptographic algorithm used to calculate the request signature",
            "x-amz-credential": "Contains the AWS access key ID combined with the signature scope (date, region, and service)",
            "x-amz-date": "date in which the request was made",
            "policy": "base 64 encoded string of the requested policy (expiration date, conditions, and all data mentioned above)",
            "x-amz-signature": "signature encrypted by algorithm mentioned in 'x-amz-algorithm'"
        }
    }
    ```
    """

    presigned_post = await request_access()
    return presigned_post


@router.get("/{exercise_id}", response_model=ExerciseInfo)
async def get_exercise(session: SessionDep, exercise_id: int):
    """
    Returns specified exercise by **{exercise_id}** as **ExerciseInfo** object

    **ExerciseInfo consists of:**
    * **id:** `int` -> id of exercise
    * **exercise_name:** `str` -> name of exercise
    * **exercise_type:** `str` -> string representation of type, current members are mentioned above

    *Returns* **ExerciseInfo** object encoded as JSON
    """
    exercise = await session.exec(select(Exercise).where(Exercise.id == exercise_id))
    return exercise.first()


# i have doubts about this exercise name, maybe it should change?
@router.get("/{exercise_id}/start")
async def start_exercise(exercise_id: int, user: CurrentUser, session: SessionDep):
    """
    Returns presigned url consisting of get_object method which is needed for getting file from bucket

    ### Params:
    * **exercise_id:** `int` -> id of exercise which we need to start

    ### Returns:
    json encoded data in consisting format:
    ```json
    {
        "presigned_url": "presigned_url, -> url which enables getting audio file and results file from bucket",
        "processed_data": "processed_data -> results encoded in json format"
    }
    ```
    * **HTTP STATUS 404:** if the exercise does not exist
    * **HTTP STATUS 409:** if the exercise exists and is not processed
    """
    exercise = await session.exec(select(Exercise).where(Exercise.id == exercise_id))
    exercise = exercise.first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    presigned_url = bucket_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.bucket_name, "Key": f"exercise/{exercise_id}/vocal.wav"},
        ExpiresIn=3600,
    )

    processed_song_array = bucket_client.get_object(
        Bucket=settings.bucket_name, Key=f"exercise/{exercise_id}/results.json")
    processed_data = json.loads(bytearray(processed_song_array["Body"].read()))

    return {"presigned_url": presigned_url, "processed_data": processed_data}


@router.post("/schedule-processing")
async def schedule_processing(session: SessionDep, exercise_name: str = Form(), file_path: str = Form(),
                              exercise_type: int = Form()):
    """
    Creates Exercise placeholder with processed flag est to false, and creates entry within taskqueue table so our worker can notice its existence

    Data are to be given in form-data format

    ### Parameters:
    * **exercise_name** -> name of exercise
    * **file_path** -> path to file, needed for task queue and for task queue only
    * **exercise_type** -> type of exercise (members mentioned above)

    ### Returns:
    * **HTTP STATUS 409** -> Exercise with this name already exists
    * **HTTP STATUS 422** -> Typed data is not valid
    * **HTTP STATUS 500** -> Problem with database connection
    * **HTTP STATUS 200** -> When there is no problem
    """
    await register_exercise(session, exercise_name, file_path, exercise_type)
