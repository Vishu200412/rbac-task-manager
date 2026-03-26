from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.routes import auth, tasks, admin
from app.core.middleware import RequestLoggingMiddleware
from app.core.logger import get_logger

logger = get_logger("main")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Manager API",
    description="A scalable REST API with JWT authentication and role-based access control",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Request logging middleware (must be before CORS)
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(admin.router)

logger.info("Task Manager API started successfully")


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Task Manager API is running",
        "docs": "/api/docs",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
