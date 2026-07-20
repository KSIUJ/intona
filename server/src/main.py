from src.auth.models import User, UserPublicWithType
from src.models import ExerciseWithTeam, Exercise
from src.database import SessionDep
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

app = FastAPI()

#ToDo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#testing endpoint
@app.get("/users", response_model=list[UserPublicWithType])
def user(session: SessionDep):
    users = session.exec(select(User)).all()
    return users

@app.get("/excersise", response_model=list[ExerciseWithTeam])
def excersise(session: SessionDep):
    exercises = session.exec(select(Exercise)).all()
    return exercises


