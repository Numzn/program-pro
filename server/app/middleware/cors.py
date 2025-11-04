from fastapi.middleware.cors import CORSMiddleware
from app.config import settings


def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_URL,
            "https://program-pro-1.onrender.com",  # Actual frontend URL
            "https://program-pro.onrender.com",
            "http://localhost:5173",  # Vite default port
            "http://localhost:3000",  # Vite configured port
            "http://localhost:3002",  # Alternative local dev port
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3002",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

