from pydantic import SecretStr
from pydantic_settings import BaseSettings

class Settings(BaseSettings):

    bucket_endpoint: str
    bucket_name: str
    bucket_secret_key: SecretStr
    bucket_access_key: SecretStr

    successful_upload_url: str

    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    database_url: str


settings = Settings() # type: ignore  # Loaded from .env file