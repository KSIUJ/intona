from datetime import timedelta, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select, func

from src.config import settings
from src.auth.models import User
from src.auth.schemas import UserCreate, UserPrivate, UserPublic, Token
from src.auth.utils import hash_password, verify_password, create_access_token
from src.auth.dependencies import CurrentUser, SessionDep
from src.stats.models import UserStats
from src.exercises.models import ExerciseType

router = APIRouter()

@router.post("/register", response_model=UserPrivate, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: SessionDep):
    result = await db.exec(
        select(User).where(func.lower(User.username) == user.username.lower())
    )
    if result.first():
        raise HTTPException(status_code=400, detail="Username already exists")

    result = await db.exec(
        select(User).where(func.lower(User.email) == user.email.lower())
    )
    if result.first():
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        username=user.username,
        email=user.email.lower(),
        password_hash=hash_password(user.password),
        user_type_id=user.user_type_id,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    exercise_types = await db.exec(select(ExerciseType))
    exercise_types = exercise_types.all()

    user_stats = UserStats(id=new_user.id,
                           averageScore=0,
                           averageScoreByCategory=[{"category": exercise.type, "score": 0} for exercise in exercise_types],
                           currentStreak=0,
                           longestStreak=0,
                           masteredPercentage=0,
                           exercisesCompleted=0,
                           lastActivityDate=datetime.now())
    db.add(user_stats)
    await db.commit()

    return new_user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: SessionDep,
):
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
    return current_user

# to change later back to response_model=list[UserPublic]
@router.get("/users", response_model=list[UserPublic])
async def get_all_users(db: SessionDep):
    result = await db.exec(select(User))
    users = result.all()

    return users

@router.get("/{user_id}", response_model=UserPublic)
async def get_user(user_id: int, db: SessionDep):
    result = await db.exec(select(User).where(User.id == user_id))
    user = result.first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user