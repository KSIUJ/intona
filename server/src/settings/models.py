from sqlmodel import SQLModel, Field, Column, JSON

from src.settings.utils import generate_default_user_preferred_settings
from src.settings.schemas import UserPreferredSettings

class UserPreferredSettingsModel(SQLModel, table=True):
    __tablename__ = "user_preferred_settings"
    user_id: int  = Field(primary_key=True)
    settings: UserPreferredSettings = Field(default_factory=generate_default_user_preferred_settings, sa_column=Column(JSON))