import json
import logging
import uuid
from datetime import datetime, UTC, timedelta

from fastapi import APIRouter, HTTPException, Form
from sqlmodel import select, delete

from src.exercises.schemas import TestingExerciseInfo
from src.exercises.models import ExerciseAvailabilityLog
from src.logs.enums import EndingStatusEnum
from src.exercises.schemas import ExerciseResult, ExerciseEndResult, ExerciseDeleteInfo, ExerciseTypeInfo
from src.auth.dependencies import CurrentUser
from src.config import settings
from src.database import SessionDep
from src.exercises.enums import ExerciseTypeEnum, DifficultyEnum
from src.exercises.models import Exercise, ExerciseType
from src.exercises.schemas import ExerciseInfo
from src.exercises.utils import request_access, register_exercise, check_exercise_availability
from src.logs.models import ExerciseLogs
from src.services.s3_bucket import bucket_client
from src.stats.models import UserStats
from src.stats.utils import actualize_user_streak, update_favorite_exercise
from src.vocal_analysis.utils import add_exercise_result

router = APIRouter()

logging.basicConfig(level=logging.INFO)


# when im done testing I need to put detailed exercise info as a response model


@router.get("", response_model=list[ExerciseInfo])
async def get_exercises(db: SessionDep):
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
    exercises = await db.exec(select(Exercise))
    return exercises.all()


# for testing purposes only, later it will be deleted and /{exericse_id}/start will do its job
@router.get("/playing-test", response_model=TestingExerciseInfo)
async def get_testing_files():
    """
    This is testing endpoint which only purpose is to return presigned_urls which you can use to download files into react and test if it can be used by tone_js and Midi library

    *returns* **JSON encoded data** which consists of:
    * **midi_presigned_url:** `str` -> presigned_url
    * **xml_presigned_url:** `str` -> presigned_url
    """
    midi_file = bucket_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.bucket_name, "Key": f"midi-test/audio.midi"},
        ExpiresIn=3600,
    )
    xml_file = bucket_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.bucket_name, "Key": f"midi-test/notes.musicxml"},
        ExpiresIn=3600,
    )
    return {"midi_presigned_url": midi_file, "xml_presigned_url": xml_file}


@router.get("/types", response_model=list[ExerciseTypeInfo])
async def get_exercise_types(db: SessionDep):
    """
    > This endpoint returns all available exercise types, it's needed for showing all exercise by types

    Returns **JSON Encoded data** which represents list of `ExerciseTypeInfo` models which consists of:

    ```json
    {
        "id": int -> exercise type id
        "type": str -> exercise type name
    }
    """
    result = await db.exec(select(ExerciseType))
    result = result.all()
    return result


# for now it should be Songs/Exercise
@router.get("/list/{exercise_type}", response_model=list[ExerciseInfo])
async def get_exercises_by_category(db: SessionDep, exercise_type: ExerciseTypeEnum):
    """
    > This endpoint returns all available exercise by specified category

    Params:
    * exercise_type: ExerciseTypeEnum -> One of ExerciseTypeEnum values (Song, Exercise), i will need to later create dynamic enum so that types aren't hardcoded

    Returns **JSON Encoded data** which represents list of `ExerciseTypeInfo` models which consists of:
    ```json
    {
        "id": int -> exercise type id
        "type": str -> exercise type name
    }
    """
    exercises_by_type = await db.exec(select(Exercise).join(ExerciseType).where(ExerciseType.type == exercise_type))
    return exercises_by_type.all()


# some day i will check exact error type, but for now Exception type will be enough
@router.get("/available/{exercise_name}")
async def check_availability(db: SessionDep, user: CurrentUser, exercise_name: str):
    """
    Checks whether there is a duplicate of this exercise

    ### Needed params:
    * **exercise_name**: `str` -> name of exercise


    ### Returns:
    * **HTTP STATUS 409:** Conflict if there is a duplicate exercise
    * **HTTP STATUS 200:** If you can send exercise to processing
    """
    await check_exercise_availability(db, exercise_name)


@router.get("/request-access")
async def request_exercise_access():
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
async def get_exercise(db: SessionDep, exercise_id: int):
    """
    Returns specified exercise by **{exercise_id}** as **ExerciseInfo** object

    **ExerciseInfo consists of:**
    * **id:** `int` -> id of exercise
    * **exercise_name:** `str` -> name of exercise
    * **exercise_type:** `str` -> string representation of type, current members are mentioned above

    *Returns* **ExerciseInfo** object encoded as JSON
    """
    exercise = await db.exec(select(Exercise).where(Exercise.id == exercise_id))
    return exercise.first()


@router.post("/schedule-processing")
async def schedule_processing(db: SessionDep, exercise_name: str = Form(), slug: str = Form(),
                              difficulty: DifficultyEnum = Form(), rating: int = Form(), exercise_type: int = Form(),
                              file_path: str = Form(), ):
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
    await register_exercise(db, exercise_name, slug, difficulty, rating, exercise_type, file_path)


# i have doubts about this exercise name, maybe it should change?
@router.post("/{exercise_id}/start")
async def start_exercise(exercise_id: int, user: CurrentUser, db: SessionDep):
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

    exercise = await db.exec(select(Exercise).where(Exercise.id == exercise_id))
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

    exercise_log = ExerciseLogs(exercise_id=exercise.id, exercise_duration=exercise.exercise_duration, time_in_tune=0,
                                average_deviation=0, attempted_at=datetime.now(UTC), ended_at=None,
                                attempting_user_id=user.id,
                                status=EndingStatusEnum.ONGOING)

    db.add(exercise_log)
    await db.flush()
    await db.refresh(exercise_log)

    secret_token = str(uuid.uuid4())
    active_exercise = ExerciseAvailabilityLog(log_id=exercise_log.id,
                                              secret_exercise_token=secret_token)

    db.add(active_exercise)
    await db.commit()

    logging.info("no problem with starting exercise")

    return {"presigned_url": presigned_url, "processed_data": processed_data, "log_id": exercise_log.id,
            "exercise_access_token": secret_token}


# i won't use access token to authenticate user because refresh token and access token
# can expire when someone is exercising
@router.post("/{exercise_log_id}/end", response_model=ExerciseEndResult)
async def end_exercise(db: SessionDep, exercise_log_id: str, exercise_result: ExerciseResult):
    exercise_log_id = int(exercise_log_id)

    exercise_log = await db.exec(select(ExerciseLogs).where(ExerciseLogs.id == exercise_log_id))
    exercise_log = exercise_log.one()

    attempting_user_id = exercise_log.attempting_user_id

    user_stats = await db.exec(select(UserStats).where(UserStats.id == attempting_user_id))
    user_stats = user_stats.one()

    exercise_log.exercise_duration = exercise_result.exercise_duration
    exercise_log.time_in_tune = exercise_result.time_in_tune
    exercise_log.average_deviation = exercise_result.average_deviation

    db.add(exercise_log)

    logging.info(exercise_log)

    user_stats.total_practice_time += exercise_result.exercise_duration

    counted_toward_stats = False

    if exercise_result.exercise_end_status == EndingStatusEnum.ENDED:
        exercise = await db.exec(select(Exercise).where(Exercise.id == exercise_log.exercise_id))
        exercise = exercise.one()

        expected_exercise_end = exercise_log.attempted_at + timedelta(seconds=exercise.exercise_duration)
        # let's say i will allow a delay of 30 seconds, but maybe later i should check if there should be any delays
        # if any of these is not true then there are some problems
        # when we have time we can test more protection like: and abs(exercise.exercise_duration - exercise_log.exercise_duration) < 30 and expected_exercise_end < datetime.now(UTC)
        if exercise is not None:
            await add_exercise_result(db, attempting_user_id, exercise_log, user_stats)
            await actualize_user_streak(user_stats, db)
            await update_favorite_exercise(user_stats, exercise_log.exercise_id, db)
            exercise_log.status = EndingStatusEnum.ENDED
            counted_toward_stats = True
            logging.info("exercise ended properly and results should be included")
        else:
            logging.info("The exercise was not ended properly")
            raise HTTPException(status_code=409, detail="The exercise was not ended properly")
    else:
        exercise_log.status = EndingStatusEnum.STOPPED
        db.add(user_stats)
        logging.info("exercise ended properly and results should not be included (total_practice_time is an exception)")
    await db.commit()

    return ExerciseEndResult(
        exercise_duration=exercise_log.exercise_duration,
        time_in_tune=exercise_log.time_in_tune,
        average_deviation=exercise_log.average_deviation,
        exercise_end_status=exercise_log.status,
        counted_toward_stats=counted_toward_stats,
    )


@router.delete("/{exercise_log_id}/end")
async def remove_access_to_log(db: SessionDep, exercise_log_id: str, exercise_delete_info: ExerciseDeleteInfo):
    exercise_log_id = int(exercise_log_id)

    exercise_availability_log = await db.exec(
        select(ExerciseAvailabilityLog).where(ExerciseAvailabilityLog.log_id == exercise_log_id))
    exercise_availability_log = exercise_availability_log.one()

    if exercise_availability_log is not None and exercise_availability_log.secret_exercise_token == exercise_delete_info.secret_exercise_token:
        statement = delete(ExerciseAvailabilityLog).where(
            ExerciseAvailabilityLog.log_id == exercise_log_id)  # type: ignore
        result = await db.execute(statement)  # type: ignore
        await db.commit()
        if result.rowcount == 0:  # type: ignore
            raise HTTPException(status_code=409, detail="Exercise was already ended")
    else:
        raise HTTPException(status_code=409, detail="Exercise was already ended / stopped")
