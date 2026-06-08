from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    google_application_credentials: str
    vertex_ai_project_id: str
    vertex_ai_location: str = "us-central1"
    vertex_ai_model: str = "gemini-2.0-flash-lite"
    environment: str = "development"
    cors_origins: str = "*"
    firebase_credentials_path: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg sslmode'u URL'de kabul etmiyor, connect_args ile veriyoruz
        url = url.replace("?sslmode=require", "").replace("&sslmode=require", "")
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
