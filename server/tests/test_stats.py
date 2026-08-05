import pytest
from datetime import datetime, date
from src.main import app
from src.auth.models import User, UserType
from src.auth.router import get_current_user
from src.auth.utils import create_access_token 
from src.stats.models import UserStats

@pytest.mark.asyncio
async def test_get_user_stats_success(client, async_session):
    test_user_type = UserType(id=2, name="normal")
    async_session.add(test_user_type)
    await async_session.commit()

    test_user = User(id=1, 
                     username="testuser", 
                     email="test@example.com", 
                     password_hash="fakehash", 
                     user_type_id=2
                     )
    test_stats = UserStats(
        id=1,
        averageScore=85.5,
        averageScoreByCategory={"Pitch": {"score": 85.5, "count": 1}},
        currentStreak=3,
        longestStreak=5,
        masteredPercentage=50.0,
        exercisesCompleted=10,
        lastActivityDate=datetime.now()
    )
    
    async_session.add(test_user)
    async_session.add(test_stats)
    await async_session.commit()

    app.dependency_overrides[get_current_user] = lambda: test_user
    token = create_access_token(data={"sub": "1"})
    response = await client.get(
        "/api/users/1/stats",
        headers={"Authorization": f"Bearer {token}"}
        )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["averageScore"] == 85.5
    assert data["currentStreak"] == 3
    assert data["exercisesCompleted"] == 10
    assert "lastActivityDate" in data