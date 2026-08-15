from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserTypePrivate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str

class UserBase(BaseModel):
    username: str = Field(min_length=1, max_length=20)
    email: EmailStr = Field(max_length=100)
    user_type_id: int = Field(default=2)

class UserCreate(UserBase):
    password:str = Field(min_length=8, max_length=30)

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str

class UserPrivate(UserPublic):
    email: str
    type: UserTypePrivate


class Token(BaseModel):
    access_token:str
    token_type:str

class Tokens(BaseModel):
    access_token:Token
    refresh_token: str

