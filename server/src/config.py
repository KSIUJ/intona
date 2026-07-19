from pydantic import PostgresDsn
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_url: PostgresDsn

settings = Settings()  # type: ignore