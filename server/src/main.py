import select

from src.models import Users
from src.database import SessionDep
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/user", response_model=list[Users])
def user(session: SessionDep) -> list[Users]:
    users = session.exec(select(Users)).all()
    for user in users:
        print(user)
    return users



