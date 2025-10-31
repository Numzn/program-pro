from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from app.database.migrations import run_migrations
from app.middleware.cors import setup_cors
from app.middleware.error_handler import validation_exception_handler, general_exception_handler
from app.auth.router import router as auth_router
from app.config import settings


app = FastAPI(title="Church Program Pro API", version="1.0.0")

setup_cors(app)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])


@app.on_event("startup")
async def startup_event():
    try:
        # Run Alembic migrations to ensure database schema is up to date
        run_migrations(environment=settings.ENVIRONMENT)
    except Exception as e:
        # Do not crash app on startup if migrations fail; log and continue
        print(f"⚠️  Database migrations skipped due to error: {e}")
        print("🔄 Server will continue, but database may be out of sync")


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


