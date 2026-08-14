from sqlmodel import SQLModel, Field, Relationship

from src.logs.models import ExerciseLogs

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

    user_type_id: int = Field(nullable=False, default=2, foreign_key="users_type.id")
    # in the near future i will change this to lazy loading now it is eager loading
    type: UserType = Relationship(back_populates="users", sa_relationship_kwargs={"lazy": "selectin"})
    stats: "UserStats" = Relationship(back_populates="user",sa_relationship_kwargs={"lazy": "selectin", "uselist": False} )
    logs: list[ExerciseLogs] = Relationship(back_populates="user", sa_relationship_kwargs={"lazy": "raise"})