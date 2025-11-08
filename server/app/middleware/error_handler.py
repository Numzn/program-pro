from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Log validation errors for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("Validation error", extra={
        "errors": exc.errors(),
        "body": exc.body if hasattr(exc, 'body') else None,
        "url": str(request.url)
    })
    
    # Format errors for frontend
    error_messages = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "Invalid value")
        error_messages.append(f"{field}: {msg}")
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({
            "success": False, 
            "message": "Validation error", 
            "error": "; ".join(error_messages),
            "errors": exc.errors()
        }),
    )

    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response


async def general_exception_handler(request: Request, exc: Exception):
    # Log the full error for debugging
    import traceback
    import logging
    logger = logging.getLogger(__name__)
    error_trace = traceback.format_exc()
    logger.error(f"❌ Error: {exc}")
    logger.error(f"📋 Traceback:\n{error_trace}")
    
    # In production, only return generic message for security
    # But log full details for debugging
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal server error", "error_type": type(exc).__name__},
    )

    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"

    return response

