from typing import Annotated

from fastapi import Depends
from src.config import settings
from sqlmodel import create_engine, Session

engine = create_engine(str(settings.postgres_url))

def get_db():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]

