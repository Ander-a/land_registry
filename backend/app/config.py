from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        # env file should live in the backend folder next to this project root
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
