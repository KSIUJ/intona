import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel

from src.main import app
from src.database import get_db
from src.config import settings

test_engine = create_async_engine(settings.test_database_url, echo=False)
TestingSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="function")
async def async_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with TestingSessionLocal() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def override_get_db(async_session):
    app.dependency_overrides[get_db] = lambda: async_session
    yield
    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def client(override_get_db): 
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac