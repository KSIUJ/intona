from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from tests.conftest import create_test_user, login_user, auth_header
from src.stats.models import UserStats

pytestmark = pytest.mark.anyio

async def test_get_user_stats_success(client: AsyncClient, db_session: AsyncSession):
    user_data = await create_test_user(
        client, 
        username="stats_user", 
        email="stats@example.com"
    )
    user_id = user_data["id"]
    token = await login_user(client, email="stats@example.com")

    result = await db_session.exec(select(UserStats).where(UserStats.id == user_id))
    stats = result.first()
    stats.averageScore = 85.5
    stats.currentStreak = 3
    stats.longestStreak = 5
    stats.exercisesCompleted = 10
    stats.lastActivityDate = datetime.now(timezone.utc)
    
    db_session.add(stats)
    await db_session.commit()

    response = await client.get(
        f"/api/users/{user_id}/stats",
        headers=auth_header(token)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["averageScore"] == 85.5
    assert data["currentStreak"] == 3
    assert data["longestStreak"] == 5
    assert data["exercisesCompleted"] == 10
    assert "lastActivityDate" in data


async def test_get_user_stats_forbidden_for_other_user(client: AsyncClient):
    user1 = await create_test_user(client, username="user_one", email="user1@example.com")
    user2 = await create_test_user(client, username="user_two", email="user2@example.com")

    token_user1 = await login_user(client, email="user1@example.com")

    response = await client.get(
        f"/api/users/{user2['id']}/stats",
        headers=auth_header(token_user1)
    )

    assert response.status_code == 403


async def test_get_user_stats_resets_streak_on_inactivity(
    client: AsyncClient, 
    db_session: AsyncSession
):
    user_data = await create_test_user(client, username="streak_user", email="streak@example.com")
    user_id = user_data["id"]
    token = await login_user(client, email="streak@example.com")

    result = await db_session.exec(select(UserStats).where(UserStats.id == user_id))
    stats = result.first()
    stats.currentStreak = 5
    stats.lastActivityDate = datetime.now(timezone.utc) - timedelta(days=2)
    
    db_session.add(stats)
    await db_session.commit()

    response = await client.get(
        f"/api/users/{user_id}/stats",
        headers=auth_header(token)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["currentStreak"] == 0


async def test_get_user_stats_unauthorized(client: AsyncClient):
    response = await client.get("/api/users/1/stats")
    assert response.status_code == 401