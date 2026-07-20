from sqlmodel import Field, SQLModel

class UserType(SQLModel, table=True):
    __tablename__ = "users_type"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)

    user_type_id: int | None = Field(default=None, foreign_key="users_type.id")