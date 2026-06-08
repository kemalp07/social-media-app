from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    gemini_api_key: str
    firebase_credentials_path: str = ""
    environment: str = "development"
    cors_origins: str = "*"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
