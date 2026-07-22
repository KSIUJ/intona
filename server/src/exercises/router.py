from fastapi import APIRouter
from sqlmodel import select

from src.database import SessionDep
from src.exercises.models import Exercise
from src.exercises.schemas import ExercisePublic, ExerciseCreate
from src.auth.dependencies import AdminUser

router = APIRouter()

@router.post("/post", response_model=ExercisePublic)
async def post_exercise(session: SessionDep, data: ExerciseCreate, user: AdminUser):
    new_exercise = Exercise(file_name=data.file_name,
                            path=data.path,
                            type=data.type)
    session.add(new_exercise)
    await session.commit()
    await session.refresh(new_exercise)
    return new_exercise

@router.get("/", response_model=list[ExercisePublic])
async def get_exercises(session: SessionDep):
    exercises = await session.exec(select(Exercise))
    return exercises.all()

@router.get("/{id}", response_model=ExercisePublic)
async def get_exercise(session: SessionDep, id: int):
    exercise = await session.exec(select(Exercise).where(Exercise.id == id))
    return exercise.first()





