from datetime import timedelta, datetime, UTC
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select, func

from src.config import settings
from src.auth.models import User
from src.auth.schemas import UserCreate, UserPrivate, UserPublic, Token
from src.auth.utils import hash_password, verify_password, create_access_token
from src.auth.dependencies import AdminUser, CurrentUser, SessionDep
from src.stats.models import UserStats
from src.exercises.models import ExerciseType

router = APIRouter()

@router.post("/register", response_model=UserPrivate, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: SessionDep):
    """
    Creates new user and detailed stats for this user

    ### Parameters:
    * **username**: `str` -> name of user
    * **email**: `str` -> email of user
    * **password**: `str` -> password of user
    * **user_type_id**: `int` -> id of user type, which has members mentioned below:
        * admin: 1
        * user: 2

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
        user_type_id=user.user_type_id
    )

    db.add(new_user)
    # we don't need to commit instantly, it would be better to commit this all at once(at the end)
    await db.flush()

    exercise_types = await db.exec(select(ExerciseType))
    exercise_types = exercise_types.all()

    user_stats = UserStats(id=new_user.id,
                           averageScore=0,
                           averageScoreByCategory=[{"category": exercise.type, "score": 0} for exercise in exercise_types],
                           currentStreak=0,
                           longestStreak=0,
                           masteredPercentage=0,
                           exercisesCompleted=0,
                           lastActivityDate=datetime.now(UTC))
    db.add(user_stats)
    await db.commit()

    return new_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep,
):
    """
    Verifies whether typed username and password are correct

    Data should be typed as a form-data

    ### Parameters:
    * **username**: `str` -> user username
    * **password**: `str` -> user password

    ### Returns:
    JSON encoded data in format mentioned below:
    ```json
    {
        "access_token": "str -> access token",
        "token_type": "str -> token type e.g. bearer"
    }
    ```
    **HTTP STATUS 401** -> when username doesn't exist, or email doesn't exist
    """
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
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")

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

    **HTTP STATUS 404** -> User not found
    """
    result = await db.exec(select(User).where(User.id == user_id))
    user = result.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user