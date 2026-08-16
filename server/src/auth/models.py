from datetime import datetime, UTC
from typing import TYPE_CHECKING

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from src.logs.models import ExerciseLogs
    from src.stats.models import UserStats

class UserType(SQLModel, table=True):
    __tablename__ = "users_type"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(nullable=False, unique=True)

    users: list["User"] = Relationship(back_populates="type", sa_relationship_kwargs={"lazy": "selectin"})

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None  = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    joined_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    user_type_id: int = Field(nullable=False, default=2, foreign_key="users_type.id")
    # in the near future i will change this to lazy loading now it is eager loading
    type: UserType = Relationship(back_populates="users", sa_relationship_kwargs={"lazy": "selectin"})
    stats: "UserStats" = Relationship(back_populates="user",sa_relationship_kwargs={"lazy": "selectin", "uselist": False} )
    logs: list["ExerciseLogs"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})
    # for testing purposes refresh tokens will be one to many, later i will think about making it one to one
    refresh_tokens: list["RefreshToken"] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "selectin"})


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(default=None, foreign_key="users.id")
    payload: str = Field(nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

    user: User = Relationship(back_populates="refresh_tokens" ,sa_relationship_kwargs={"lazy": "selectin", "uselist": False})