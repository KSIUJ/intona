from sqlmodel import SQLModel, Field, Relationship
# i don't know if this should be in global modules

class ExerciseTypeBase(SQLModel):
    type: str = Field(nullable=False, unique=True)

class ExerciseType(ExerciseTypeBase, table=True):
    __tablename__ = "exercise_types"
    id: int | None = Field(default=None, primary_key=True)

    exercises: list["Exercise"] = Relationship(back_populates="exercise_type")

class ExerciseTypePublic(ExerciseTypeBase):
    id: int

class ExerciseBase(SQLModel):
    file_name: str = Field(unique=True, nullable=False)
    path: str = Field(nullable=False)

    type: int = Field(nullable=False, foreign_key="exercise_types.id")

class Exercise(ExerciseBase, table=True):
    __tablename__ = "exercises"
    id: int | None = Field(default=None, primary_key=True)
    exercise_type: ExerciseType = Relationship(back_populates="exercises")

class ExercisePublic(ExerciseBase):
    id: int

class ExerciseWithTeam(ExercisePublic):
    exercise_type: ExerciseTypePublic

