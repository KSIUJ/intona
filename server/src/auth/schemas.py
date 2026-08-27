from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserTypePrivate(BaseModel):
    id: int
    name: str

class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=40)
    email: EmailStr = Field(max_length=100)

class UserCreate(UserBase):
    password:str = Field(min_length=8, max_length=30)

class UserPublic(BaseModel):
    id: int
    username: str
    joined_at: datetime

class UserPrivate(UserPublic):
    email: str

    type: UserTypePrivate = Field(description="Shows users type", examples=["user", "admin"])


class Token(BaseModel):
    access_token:str
    token_type:str = Field(description="type of the authorization token", examples=["Bearer"])

class Tokens(BaseModel):
    access_token:Token
    refresh_token: str

