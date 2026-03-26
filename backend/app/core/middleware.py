import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logger import get_logger

logger = get_logger("http")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log incoming request
        logger.info(f"→ {request.method} {request.url.path} | IP: {request.client.host}")

        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000  # ms

            # Log response
            level = "info" if response.status_code < 400 else "warning" if response.status_code < 500 else "error"
            getattr(logger, level)(
                f"← {request.method} {request.url.path} | "
                f"Status: {response.status_code} | "
                f"Duration: {duration:.1f}ms"
            )
            return response

        except Exception as exc:
            duration = (time.time() - start_time) * 1000
            logger.error(
                f"✗ {request.method} {request.url.path} | "
                f"UNHANDLED ERROR: {exc} | "
                f"Duration: {duration:.1f}ms"
            )
            raise
