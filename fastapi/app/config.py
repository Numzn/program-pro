from decouple import config


class Settings:
    DATABASE_URL: str = config("DATABASE_URL", default="postgresql://user:pass@localhost/dbname")

    JWT_SECRET: str = config("JWT_SECRET", default="your-secret-key-change-in-production")
    JWT_REFRESH_SECRET: str = config("JWT_REFRESH_SECRET", default="your-refresh-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    FRONTEND_URL: str = config("FRONTEND_URL", default="https://program-pro-1.onrender.com")
    ENVIRONMENT: str = config("ENVIRONMENT", default="production")


settings = Settings()


