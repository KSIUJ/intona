import pytest
from httpx import AsyncClient
from tests.conftest import create_test_user, login_user, auth_header

pytestmark = pytest.mark.anyio

async def test_register_validation_error(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
        },
    )

    assert response.status_code == 422
    response_text = response.text.lower()
    assert "email" in response_text
    assert "password" in response_text


async def test_register_duplicate_email(client: AsyncClient):
    await create_test_user(
        client, 
        username="user1", 
        email="test@example.com"
    )

    response = await client.post(
        "/api/auth/register",
        json={
            "username": "different_user",
            "email": "test@example.com",
            "password": "password123",
            "user_type_id": 2,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already exists"


async def test_register_duplicate_username(client: AsyncClient):
    await create_test_user(
        client, 
        username="existing_user", 
        email="first@example.com"
    )

    response = await client.post(
        "/api/auth/register",
        json={
            "username": "EXISTING_USER",  
            "email": "second@example.com",
            "password": "password123",
            "user_type_id": 2,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


async def test_register_success(client: AsyncClient):
    """Test sprawdzający poprawny przebieg rejestracji."""
    response = await client.post(
        "/api/auth/register",
        json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepassword123",
            "user_type_id": 2,
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "type" in data  
    assert data["type"]["name"] == "user"
    
    assert "password" not in data
    assert "password_hash" not in data

async def test_successful_login(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={
            "username": "user",
            "email": "email@example.com",
            "password": "Password123",
            "user_type_id": 2
        }
    )
    
    login_response = await client.post(
        "/api/auth/token",
        data={
            "username": "email@example.com",
            "password": "Password123"
        }
    )
    
    assert login_response.status_code == 200
    token_data = login_response.json()
    
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"


async def test_login_invalid_password(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={
            "username": "user",
            "email": "email@example.com",
            "password": "ValidPassword123",
            "user_type_id": 2
        }
    )
    
    login_response = await client.post(
        "/api/auth/token",
        data={
            "username": "email@example.com",
            "password": "InvalidPassword123"
        }
    )
    
    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Incorrect email or password"


async def test_login_non_existent_user(client: AsyncClient):
    login_response = await client.post(
        "/api/auth/token",
        data={
            "username": "nobody@example.com",
            "password": "Password123"
        }
    )
    
    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Incorrect email or password"

async def test_get_current_user_me_success(client: AsyncClient):
    await create_test_user(client, email="me@example.com", password="password123")
    token = await login_user(client, email="me@example.com", password="password123")

    response = await client.get("/api/auth/me", headers=auth_header(token))

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"


async def test_get_current_user_unauthorized(client: AsyncClient):
    response = await client.get("/api/auth/me")
    
    assert response.status_code == 401

async def test_get_all_users_forbidden_for_regular_user(client: AsyncClient):
    await create_test_user(
        client, 
        username="normal_user", 
        email="user@example.com", 
        user_type_id=2
    )
    token = await login_user(client, email="user@example.com")

    response = await client.get("/api/auth/users", headers=auth_header(token))

    assert response.status_code == 403
    assert response.json()["detail"] == "User doesn't have admin permission"


async def test_get_all_users_success_for_admin(client: AsyncClient):
    await create_test_user(
        client, 
        username="admin_user", 
        email="admin@example.com", 
        user_type_id=1  
    )
    await create_test_user(
        client, 
        username="another_user", 
        email="another@example.com", 
        user_type_id=2
    )

    token = await login_user(client, email="admin@example.com")

    response = await client.get("/api/auth/users", headers=auth_header(token))

    assert response.status_code == 200
    users_list = response.json()
    
    assert len(users_list) >= 2
    
    first_user = users_list[0]
    assert "id" in first_user
    assert "username" in first_user
    assert "email" not in first_user


async def test_get_all_users_unauthorized_without_token(client: AsyncClient):
    response = await client.get("/api/auth/users")

    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"