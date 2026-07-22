from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  
    )

    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    database_url: str

    @property
    def async_database_url(self) -> str:
        """
        By default, Railway provides an address starting with 'postgresql://', 
        but due to the asynchronous database, we need 'postgresql+asyncpg://'.
        To ensure the code works locally without modification, I check whether the database is PostgreSQL.
        For local testing, SQLite might be easier to use, and thanks to SQLModel,
        it won't significantly alter the code's behavior.
        """
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url

settings = Settings()