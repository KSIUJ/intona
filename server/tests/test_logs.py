import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from src.exercises.models import Exercise, ExerciseType
from src.logs.models import ExerciseLogs
from tests.conftest import create_test_user, login_user, auth_header

pytestmark = pytest.mark.anyio

async def test_create_log_success(client: AsyncClient, db_session: AsyncSession):
    user_data = await create_test_user(client, username="log_user", email="log@example.com")
    token = await login_user(client, email="log@example.com")

    exercise_type = ExerciseType(type="Pitch")
    db_session.add(exercise_type)
    await db_session.commit()
    await db_session.refresh(exercise_type)

    exercise = Exercise(
        file_name="test_vocal.wav",
        type=exercise_type.id,
        processed=True
    )
    db_session.add(exercise)
    await db_session.commit()
    await db_session.refresh(exercise)

    payload = {
        "exercise_id": exercise.id,
        "exercise_duration": 120,
        "time_in_tune": 85.5,
        "average_deviation": 1.2
    }

    response = await client.post(
        "/api/logs/",  
        json=payload,
        headers=auth_header(token)
    )

    assert response.status_code == 201
    data = response.json()

    assert data["exercise_id"] == exercise.id
    assert data["exercise_duration"] == 120
    assert data["time_in_tune"] == 85.5
    assert data["average_deviation"] == 1.2
    assert data["attempting_user_id"] == user_data["id"]
    assert "id" in data
    assert "attempted_at" in data

    db_log = await db_session.get(ExerciseLogs, data["id"])
    assert db_log is not None
    assert db_log.exercise_duration == 120
    assert db_log.attempting_user_id == user_data["id"]


async def test_create_log_exercise_not_found(client: AsyncClient):
    await create_test_user(client, username="log_user_2", email="log2@example.com")
    token = await login_user(client, email="log2@example.com")

    payload = {
        "exercise_id": 99999,  
        "exercise_duration": 60,
        "time_in_tune": 50.0,
        "average_deviation": 3.0
    }

    response = await client.post(
        "/api/logs/",
        json=payload,
        headers=auth_header(token)
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Exercise with id 99999 does not exist"


async def test_create_log_unauthorized(client: AsyncClient):
    payload = {
        "exercise_id": 1,
        "exercise_duration": 60,
        "time_in_tune": 50.0,
        "average_deviation": 3.0
    }

    response = await client.post("/api/logs/", json=payload)

    assert response.status_code == 401


async def test_create_log_validation_error(client: AsyncClient):
    await create_test_user(client, username="log_user_3", email="log3@example.com")
    token = await login_user(client, email="log3@example.com")

    payload = {
        "exercise_id": 1,
        "exercise_duration": 60
    }

    response = await client.post(
        "/api/logs/",
        json=payload,
        headers=auth_header(token)
    )

    assert response.status_code == 422
    assert "detail" in response.json()