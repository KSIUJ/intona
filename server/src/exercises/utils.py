import logging
import sys

from fastapi import UploadFile, File, HTTPException
from sqlmodel import select

from src.config import settings
from src.database import SessionDep
from src.exercises.models import Exercise, ProcessExercise
from src.services.config import CONDITIONS
from src.services.s3_bucket import bucket_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

MAX_FILE_SIZE = 1024 * 1024 * 50  # 50 MB
ALLOWED_MIME_TYPES = {"audio/wav", "audio/x-wav", "audio/mpeg"}


async def validate_exercise(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported file type.")

async def check_exercise_availability(session: SessionDep, file_name : str):
    duplicate_exercise = await session.exec(select(Exercise).where(Exercise.file_name == file_name))
    duplicate_exercise = duplicate_exercise.first()
    if not duplicate_exercise:
        raise HTTPException(status_code=409, detail="Exercise with this name already exists")

async def request_access():
    #it should only return presigned post so user can post exercise
    # on specified bucket
    presigned_post = bucket_client.generate_presigned_post(Bucket=settings.bucket_name,Key="temp/${filename}",Conditions=CONDITIONS)
    return presigned_post


async def register_exercise(session: SessionDep, file_name: str, file_path: str, exercise_type: int):
    new_exercise = Exercise(file_name=file_name, type=exercise_type)
    session.add(new_exercise)
    await session.commit()
    await session.refresh(new_exercise)

    # for what I understand it should always return not none id
    exercise_id = new_exercise.id

    process_exercise_info = ProcessExercise(exercise_name=file_name, exercise_id=exercise_id, exercise_path=file_path, status="waiting")
    session.add(process_exercise_info)
    await session.commit()


