from fastapi.middleware.cors import CORSMiddleware
from app.config import settings


def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_URL,
            "https://program-pro-1.onrender.com",  # Actual frontend URL
            "https://program-pro.onrender.com",
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

