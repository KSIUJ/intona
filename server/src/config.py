from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict;

class Settings(BaseSettings):
    #model_config = SettingsConfigDict(env_file='../../.env', env_file_encoding='utf-8')
    postgres_url: PostgresDsn = "postgresql://postgres:tDBihXWlMxgFNLpAiwqcwXGfELphYHqP@postgres.railway.internal:5432/railway"

settings = Settings()  # type: ignore