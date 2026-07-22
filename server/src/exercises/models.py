from sqlmodel import Field, Relationship, SQLModel

class ExerciseType(SQLModel, table=True):
    __tablename__ = "exercise_types"
    id: int | None = Field(default=None, primary_key=True)
    type: str = Field(nullable=False, unique=True)

    exercises: list["Exercise"] = Relationship(back_populates="exercise_type", sa_relationship_kwargs={"lazy": "selectin"},)


class Exercise(SQLModel, table=True):
    __tablename__ = "exercises"
    id: int | None = Field(default=None, primary_key=True)
    file_name: str = Field(nullable=False, unique=True)
    path: str = Field(nullable=False, unique=True)

    type: int = Field(nullable=False, foreign_key="exercise_types.id")
    exercise_type: ExerciseType = Relationship(back_populates="exercises", sa_relationship_kwargs={"lazy": "selectin"},)





