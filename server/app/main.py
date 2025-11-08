import logging
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.database.migrations import run_migrations
from app.database.init_data import ensure_admin_user
from app.middleware.cors import setup_cors
from app.middleware.error_handler import validation_exception_handler, general_exception_handler
from app.auth.router import router as auth_router
from app.programs.router import router as programs_router
from app.church.router import router as church_router
from app.templates.router import router as templates_router
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class ProxyHeadersMiddleware(BaseHTTPMiddleware):
    """Custom middleware to trust proxy headers from Render and other reverse proxies."""
    async def dispatch(self, request: Request, call_next):
        # Trust X-Forwarded-* headers from Render
        if "x-forwarded-for" in request.headers:
            # Extract the original client IP
            forwarded_for = request.headers.get("x-forwarded-for")
            if forwarded_for:
                # Take the first IP (original client)
                request.state.forwarded_for = forwarded_for.split(",")[0].strip()
        
        if "x-forwarded-proto" in request.headers:
            # Use the forwarded protocol (http/https)
            request.state.forwarded_proto = request.headers.get("x-forwarded-proto")
        
        if "x-forwarded-host" in request.headers:
            # Use the forwarded host
            request.state.forwarded_host = request.headers.get("x-forwarded-host")
        
        response = await call_next(request)
        return response


app = FastAPI(title="Church Program Pro API", version="1.0.0")

# Setup CORS FIRST (middleware executes in reverse order, so this will run last and add headers)
setup_cors(app)

# Trust proxy headers AFTER CORS (this runs first to process headers)
app.add_middleware(ProxyHeadersMiddleware)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Register routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(programs_router, prefix="/api/v1/programs", tags=["programs"])
app.include_router(church_router, prefix="/api/v1/church", tags=["church"])
app.include_router(templates_router, prefix="/api/v1/templates", tags=["templates"])


@app.on_event("startup")
async def startup_event():
    try:
        # Run Alembic migrations to ensure database schema is up to date
        logger.info("Running database migrations...")
        run_migrations(environment=settings.ENVIRONMENT)
        logger.info("Database migrations completed successfully")
    except Exception as e:
        # Do not crash app on startup if migrations fail; log and continue
        logger.warning(f"Database migrations skipped due to error: {e}")
        logger.warning("Server will continue, but database may be out of sync")
    
    try:
        # Ensure admin user exists
        logger.info("Checking for admin user...")
        ensure_admin_user()
        logger.info("Admin user initialization completed")
    except Exception as e:
        # Do not crash app on startup if initialization fails; log and continue
        logger.warning(f"Admin user initialization failed: {e}")
        logger.warning("Server will continue, but admin user may not exist")


@app.get("/")
async def root():
    return {"success": True, "message": "Church Program Pro API - FastAPI", "version": "1.0.0"}


@app.get("/api/v1")
async def api_v1_info():
    return {
        "success": True,
        "message": "Church Program Pro API - v1",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/auth",
            "programs": "/api/v1/programs",
            "templates": "/api/v1/templates",
            "church": "/api/v1/church",
            "health": "/health",
        },
    }


@app.get("/health")
async def health_check():
    return {"success": True, "status": "healthy"}


