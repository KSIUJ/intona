from pathlib import Path
from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):

    bucket_endpoint: str
    bucket_name: str
    bucket_secret_key: SecretStr
    bucket_access_key: SecretStr

    resend_api_key: SecretStr

    successful_upload_url: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    database_url: str
    test_database_url: str

    @property
    def async_database_url(self) -> str:
        """
        By default, Railway provides an address starting with 'postgresql://',
        but due to the asynchronous database, we need 'postgresql+asyncpg://'.
        """
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.database_url
    @property
    def async_test_database_url(self) -> str:
        """
        By default, Railway provides an address starting with 'postgresql://',
        but due to the asynchronous database, we need 'postgresql+asyncpg://'.
        """
        if self.test_database_url.startswith("postgresql://"):
            return self.test_database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.test_database_url

settings = Settings()

