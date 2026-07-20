from sqlmodel import SQLModel, Field, Relationship

class UserTypeBase(SQLModel):
    type: str = Field(unique=True, nullable=False)

class UserType(UserTypeBase, table=True):
    __tablename__ = "users_type"
    id: int | None = Field(default=None, primary_key=True)

    users: list["User"] = Relationship(back_populates="type")

class UserTypePublic(UserTypeBase):
    id: int

class UserBase(SQLModel):
    name: str = Field(unique=True, nullable=False)
    email: str = Field(unique=True, nullable=False)

class User(UserBase, table=True):
    __tablename__ = "users"
    id: int | None  = Field(default=None, primary_key=True)
    password: str = Field(nullable=False)
    user_type: int = Field(nullable=False, foreign_key="users_type.id")
    type: UserType = Relationship(back_populates="users")

class UserPublic(UserBase):
    id: int

class UserPublicWithType(UserPublic):
    type: UserTypePublic

