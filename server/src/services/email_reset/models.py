from datetime import datetime, UTC

from sqlalchemy import DateTime
from sqlmodel import SQLModel, Field


class EmailVerifyCode(SQLModel, table=True):
    __tablename__ = "reset_password_codes"
    id: int | None = Field(primary_key=True)
    email: str = Field(nullable=False)
    payload: str = Field(nullable=False)
    expire_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )

class EmailVerifyToken(SQLModel, table=True):
    __tablename__ = "reset_password_tokens"
    id: int | None = Field(primary_key=True)
    email: str = Field(nullable=False)
    payload: str = Field(nullable=False)
    expire_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_type=DateTime(timezone=True),
        nullable=False
    )




