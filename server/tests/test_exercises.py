from unittest.mock import MagicMock, patch
import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from src.exercises.models import Exercise, ExerciseType, ProcessExercise
from tests.conftest import create_test_user, login_user, auth_header

pytestmark = pytest.mark.anyio

# Fixture

async def create_sample_exercise_type(db_session: AsyncSession, name: str = "Vocal Range") -> ExerciseType:
    exercise_type = ExerciseType(type=name)
    db_session.add(exercise_type)
    await db_session.commit()
    await db_session.refresh(exercise_type)
    return exercise_type


# Endpoint tests

async def test_get_exercises_empty(client: AsyncClient):
    response = await client.get("/api/exercises/")
    
    assert response.status_code == 200
    assert response.json() == []


async def test_get_exercises_with_data(client: AsyncClient, db_session: AsyncSession):
    ex_type = await create_sample_exercise_type(db_session, name="Pitch Matching")
    
    exercise = Exercise(
        file_name="test.wav",
        type=ex_type.id,
        processed=True
    )
    db_session.add(exercise)
    await db_session.commit()

    response = await client.get("/api/exercises/")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["file_name"] == "test.wav"
    assert data[0]["exercise_type"]["id"] == ex_type.id
    assert data[0]["exercise_type"]["type"] == "Pitch Matching"


async def test_get_exercise_by_id_success(client: AsyncClient, db_session: AsyncSession):
    ex_type = await create_sample_exercise_type(db_session)
    exercise = Exercise(file_name="test.wav", type=ex_type.id)
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(exercise)

    response = await client.get(f"/api/exercises/{exercise.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == exercise.id
    assert data["file_name"] == "test.wav"


async def test_schedule_processing_success(client: AsyncClient, db_session: AsyncSession):
    ex_type = await create_sample_exercise_type(db_session, name="Intervals")

    form_data = {
        "file_name": "my_new_exercise.wav",
        "file_path": "temp/my_new_exercise.wav",
        "exercise_type": str(ex_type.id)
    }

    response = await client.post("/api/exercises/schedule-processing", data=form_data)
    
    assert response.status_code == 200

    exercise_statement = select(Exercise).where(Exercise.file_name == "my_new_exercise.wav")
    exercise_result = await db_session.exec(exercise_statement)
    created_exercise = exercise_result.first()
    assert created_exercise is not None
    assert created_exercise.type == ex_type.id

    queue_statement = select(ProcessExercise).where(ProcessExercise.exercise_id == created_exercise.id)
    queue_result = await db_session.exec(queue_statement)
    queued_task = queue_result.first()
    assert queued_task is not None
    assert queued_task.status == "waiting"

@patch("src.exercises.router.bucket_client")
async def test_start_exercise_success(mock_s3, client: AsyncClient, db_session: AsyncSession):
    await create_test_user(client, username="player_user", email="player@example.com")
    token = await login_user(client, email="player@example.com")

    exercise_type = await create_sample_exercise_type(db_session)
    exercise = Exercise(file_name="sing_test.wav", type=exercise_type.id)
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(exercise)

    mock_s3.generate_presigned_url.return_value = "https://s3.fake-url.com/exercise.wav"
    
    fake_json_bytes = b'{"notes": ["C4", "E4", "G4"], "rate": 120}'
    mock_s3.get_object.return_value = {
        "Body": MagicMock(read=lambda: fake_json_bytes)
    }

    response = await client.get(
        f"/api/exercises/{exercise.id}/start",
        headers=auth_header(token)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["presigned_url"] == "https://s3.fake-url.com/exercise.wav"
    assert data["processed_data"]["notes"] == ["C4", "E4", "G4"]


async def test_start_exercise_not_found(client: AsyncClient):
    await create_test_user(client, username="player_user2", email="player2@example.com")
    token = await login_user(client, email="player2@example.com")

    response = await client.get(
        "/api/exercises/9999/start",
        headers=auth_header(token)
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Exercise not found"


@patch("src.exercises.router.request_access")
async def test_request_exercise_access(mock_request_access, client: AsyncClient):
    mock_request_access.return_value = {
        "url": "https://s3.fake-bucket.com",
        "fields": {"key": "temp/${filename}"}
    }

    response = await client.get("/api/exercises/request-access")

    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://s3.fake-bucket.com"