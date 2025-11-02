from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder


async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    # Log validation errors for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("Validation error", extra={
        "errors": exc.errors(),
        "body": exc.body if hasattr(exc, 'body') else None,
        "url": str(_request.url)
    })
    
    # Format errors for frontend
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        error_messages.append(f"{field}: {msg}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "success": False, 
            "message": "Validation error", 
            "error": "; ".join(error_messages),
            "errors": exc.errors()
        }),
    )


async def general_exception_handler(_request: Request, exc: Exception):
    # Log the full error for debugging
    import traceback
    error_trace = traceback.format_exc()
    print(f"❌ Error: {exc}")
    print(f"📋 Traceback:\n{error_trace}")
    
    # In production, only return generic message for security
    # But log full details for debugging
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error", "error_type": type(exc).__name__},
    )

