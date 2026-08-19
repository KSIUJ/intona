import logging
import uuid
from datetime import timedelta, datetime, UTC
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select, func

from src.config import settings
from src.auth.models import User, RefreshToken
from src.auth.schemas import UserCreate, UserPrivate, UserPublic, Token, Tokens
from src.auth.utils import hash_password, verify_password, create_access_token
from src.auth.dependencies import AdminUser, CurrentUser, SessionDep
from src.stats.models import UserStats
from src.exercises.models import ExerciseType

logging.basicConfig(level=logging.INFO)

router = APIRouter()

@router.post("/register", response_model=UserPrivate, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: SessionDep):
    """
    Creates new user and detailed stats for this user

    ### Parameters:
    * **username**: `str` -> name of user
    * **email**: `str` -> email of user
    * **password**: `str` -> password of user

    ### Returns:
    **UserPrivate** encoded in JSON, which has mentioned Fields
    * **id**: `int` -> user id
    * **username**: `str` -> user username
    * **email**: `str` -> user email
    * **type**: `str` -> string interpretation of type: int, which has mentioned members:
        1) admin
        2) user

    **HTTP STATUS 409** -> when username already exists, or email already exists
    """
    result = await db.exec(
        select(User).where(func.lower(User.username) == user.username.lower())
    )
    if result.first():
        raise HTTPException(status_code=409, detail="Username already exists")

    result = await db.exec(
        select(User).where(func.lower(User.email) == user.email.lower())
    )
    if result.first():
        raise HTTPException(status_code=409, detail="Email already exists")

    new_user = User(
        username=user.username,
        email=user.email.lower(),
        password_hash=hash_password(user.password),
        # we can't leave this decision to users to the default will be user type
        user_type_id=2
    )

    db.add(new_user)
    # we don't need to commit instantly, it would be better to commit this all at once(at the end)
    await db.flush()

    exercise_types = await db.exec(select(ExerciseType))
    exercise_types = exercise_types.all()

    user_stats = UserStats(id=new_user.id,
                           average_score=0,
                           average_score_by_category={exercise.type: {"score": 0, "count": 0} for exercise in exercise_types},
                           current_streak=0,
                           longest_streak=0,
                           mastered_percentage=0,
                           exercises_completed=0,
                           total_practice_time=0,
                           days_active=0,
                           favorite_exericse=None,
                           last_activity_date=datetime.now(UTC))
    db.add(user_stats)
    await db.commit()
    await db.refresh(new_user)


    return new_user



@router.post("/token", response_model=Tokens)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep,
    remember_login: str = Form()
):
    """
    Verifies whether typed username and password are correct and if valid returns refresh token and
    access token in json format

    Data should be typed as a form-data

    ### Parameters:
    * **username**: `str` -> user username
    * **password**: `str` -> user password

    ### Returns:
    JSON encoded data in format mentioned below:
    ```json
    {
        "access_token": {
            "access_token": "str -> access token",
            "token_type": "str -> token type e.g. bearer"
        },
        "refresh_token": "str -> refresh token"


    }
    ```
    **HTTP STATUS 401** -> when username doesn't exist, or email doesn't exist
    """
    remember_login = True if remember_login == "true" else False
    result = await db.exec(
        select(User).where(func.lower(User.email) == form_data.username.lower())
    )
    user = result.first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token_payload = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    refresh_token_payload = str(user.id) + "-" + str(uuid.uuid4())
    access_token = Token(access_token=access_token_payload, token_type="bearer")
    refresh_token = RefreshToken(user_id=user.id, payload=refresh_token_payload, created_at=datetime.now(UTC), expires_at=datetime.now(UTC) + timedelta(days=30) if remember_login == True else datetime.now(UTC) + timedelta(hours=12))

    db.add(refresh_token)
    await db.commit()

    return Tokens(access_token=access_token, refresh_token=refresh_token_payload)

@router.post("/logout")
async def logout(db: SessionDep, refresh_token: str = Form()):
    """
    Deletes refresh token in database so that logout works

    Data should be typed as a form-data

    ### Parameters:
    * **refresh_token**: `str` -> refresh token to delete

    ### Returns:
    * ** HTTP STATUS 200 **
    """
    if refresh_token != "NONE":
        refresh_token_db = await db.exec(select(RefreshToken).where(RefreshToken.payload == refresh_token))
        refresh_token_db = refresh_token_db.one()
        if not refresh_token_db:
            return
        await db.delete(refresh_token_db)
        await db.commit()
    else:
        return




@router.post("/refresh", response_model=Token)
async def refresh_access_token(db: SessionDep, refresh_token: str = Form()):
    """
    Refreshes access token using refresh_token

    Data should be typed as a form-data

    ### Parameters:
    * **refresh_token**: `str` -> refresh token which is used to check if user should be able to generate new access token

    ### Returns:
    JSON encoded data in format mentioned below:
    ```json
    {
        "access_token": "str -> access token",
        "token_type": "str -> token type e.g. bearer"
    }
    **HTTP STATUS 400** -> if the token which you have is expired
    **HTTP STATUS 401** -> when the token doesn't exist or someone deleted it using logout
    """
    refresh_token_db = await db.exec(select(RefreshToken).where(RefreshToken.payload == refresh_token))
    refresh_token_db: RefreshToken = refresh_token_db.one()

    if refresh_token_db.expires_at < datetime.now(UTC):
        await db.delete(refresh_token_db)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token expired",
        )

    if not refresh_token_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refresh token not found",
        )

    user_id = refresh_token.split("-")[0]

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token_payload = create_access_token(
        data={"sub": str(user_id)},
        expires_delta=access_token_expires,
    )

    return Token(access_token=access_token_payload, token_type="bearer")



@router.get("/me", response_model=UserPrivate)
async def get_current_user(current_user: CurrentUser):
    """
    Returns current user as UserPrivate object:

    ### Parameters:
    * **token**: token received from authorization code should be in Authorization Header

    ### Returns:
    **UserPrivate** encoded in JSON, which has mentioned Fields
    * **id**: `int` -> user id
    * **username**: `str` -> user username
    * **email**: `str` -> user email
    * **type**: `str` -> string interpretation of type: int, which has mentioned members:
        1) admin
        2) user
    """
    return current_user

# to change later back to response_model=list[UserPublic]
@router.get("/users", response_model=list[UserPublic])
async def get_all_users(db: SessionDep, admin: AdminUser):
    """
    Returns list of all users if user has admin permissions

    ### Parameters:
    * **token**: token received from authorization code should be in Authorization Header

    ### Returns:
    User list, in which each User is returned as **UserPublic** object encoded in JSON with Fields mentioned below:
    * **id**: `int` -> user id
    * **username**: `str` -> user username
    """
    result = await db.exec(select(User))
    users = result.all()

    return users


#
@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: SessionDep):
    """
    Returns specified with {user_id} as UserPublic object

    ### Parameters:
    * **user_id**: `int` -> id of user which we want to get

    ### Returns:
    **UserPublic** encoded in JSON, which has mentioned Fields
    * **id**: `int` -> user id
    * **username**: `str` -> user username
    * **joined_at**: `datetime.datetime` -> user joining date

    * **HTTP STATUS 404** -> User not found
    """
    result = await db.exec(select(User).where(User.id == user_id))
    user = result.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user