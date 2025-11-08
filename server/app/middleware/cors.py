from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
import logging

logger = logging.getLogger(__name__)


def setup_cors(app):
    # Build list of allowed origins, removing duplicates
    allowed_origins_list = [
        settings.FRONTEND_URL,
        "https://program-pro-1.onrender.com",  # Actual frontend URL
        "https://program-pro.onrender.com",
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Vite configured port
        "http://localhost:3002",  # Alternative local dev port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173",
    ]
    
    # Remove duplicates while preserving order
    seen = set()
    unique_origins = []
    for origin in allowed_origins_list:
        if origin and origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)
    
    logger.info(f"🔒 Configuring CORS with allowed origins: {unique_origins}")
    
    # Use regex pattern to match all Render subdomains dynamically
    # This ensures any program-pro*.onrender.com subdomain is allowed
    render_regex = r"https://program-pro.*\.onrender\.com"
    localhost_regex = r"http://(localhost|127\.0\.0\.1)(:\d+)?"
    combined_regex = f"({render_regex}|{localhost_regex})"
    
    logger.info(f"🔒 CORS regex pattern: {combined_regex}")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=combined_regex,
        allow_origins=unique_origins,  # Explicit list for exact matches
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,  # Cache preflight for 1 hour
    )
    
    logger.info("✅ CORS middleware configured successfully")

