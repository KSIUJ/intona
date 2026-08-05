import json
import logging

import botocore.exceptions
import sqlalchemy.exc
from fastapi import APIRouter, HTTPException, Form
from sqlmodel import select

from src.auth.dependencies import CurrentUser
from src.config import settings
from src.database import SessionDep
from src.exercises.models import Exercise
from src.exercises.schemas import ExerciseInfo
from src.exercises.utils import request_access, register_exercise, check_exercise_availability
from src.services.s3_bucket import bucket_client

router = APIRouter()

logging.basicConfig(level=logging.INFO)

# when im done testing I need to put detailed exercise info as a response model

@router.get("/", response_model=list[ExerciseInfo])
async def get_exercises(session: SessionDep):
    exercises = await session.exec(select(Exercise))
    return exercises.all()

# some day i will check exact error type, but for now Exception type will be enough
@router.get("/available")
async def check_availability(session: SessionDep, user: CurrentUser, exercise_name: str = Form()):
    try:
        await check_exercise_availability(session, exercise_name)
    except Exception as e:
        logging.error(e)

@router.get("/request-access")
async def request_exercise_access(session: SessionDep):
    presigned_post = await request_access()
    return presigned_post

@router.get("/{exercise_id}", response_model=ExerciseInfo)
async def get_exercise(session: SessionDep, exercise_id: int):
    exercise = await session.exec(select(Exercise).where(Exercise.id == exercise_id))
    return exercise.first()


@router.get("/{exercise_id}/start")
async def start_exercise(exercise_id: int, user: CurrentUser, session: SessionDep):
    exercise = await session.exec(select(Exercise).where(Exercise.id == exercise_id))
    exercise = exercise.first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    logging.info(f"exercises/{exercise_id}/vocal.wav")
    presigned_url = bucket_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.bucket_name, "Key": f"exercise/{exercise_id}/vocal.wav"},
        ExpiresIn=3600,
    )

    processed_song_array = bucket_client.get_object(
        Bucket=settings.bucket_name, Key=f"exercise/{exercise_id}/results.json" )
    processed_data = json.loads(bytearray(processed_song_array["Body"].read()))

    return {"presigned_url": presigned_url, "processed_data": processed_data}


@router.post("/schedule-processing")
async def schedule_processing(session: SessionDep, file_name: str = Form(), file_path: str = Form(),  exercise_type: int = Form()):
    try:
        await register_exercise(session, file_name, file_path, exercise_type)
    except Exception as e:
        logging.error(e)
        raise HTTPException(status_code=400, detail="Bad request, there is a chance that this is internal server error")







