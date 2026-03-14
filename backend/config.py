from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str

    MONGO_INITDB_ROOT_USERNAME: str
    MONGO_INITDB_ROOT_PASSWORD: str

    OPENAI_API_KEY: str


settings = Settings()
