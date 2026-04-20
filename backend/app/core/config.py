from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://hango:hango@localhost:5432/hango"

    # JWT
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24h

    # Kakao OAuth
    kakao_client_id: str = ""
    kakao_redirect_uri: str = "http://localhost:3000/auth/kakao/callback"

    # Guest session
    guest_session_ttl_hours: int = 24

    # QR ticket time window (hours before/after event)
    qr_time_window_hours: int = 2

    # Storage (S3-compatible)
    storage_endpoint: str = ""
    storage_bucket: str = "hango"
    storage_access_key: str = ""
    storage_secret_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
