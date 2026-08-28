import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from contextlib import asynccontextmanager

from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlmodel import SQLModel

from src.auth.utils import delete_expired_tokens
from src.database import engine
from src.auth.router import router as auth_router
from src.exercises.router import router as exercise_router
from src.stats.router import router as stats_router
from src.vocal_analysis.router import router as vocal_analysis_router
from src.logs.router import router as logs_router
from src.services.email_reset.routes import router as email_reset_router
from src.settings.router import router as user_settings_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(delete_expired_tokens, "interval", seconds=600)
    scheduler.start()
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(exercise_router, prefix="/api/exercises", tags=["exercises"])
app.include_router(stats_router, prefix="/api/users", tags=["users"])
app.include_router(vocal_analysis_router, prefix="/api/vocal_analysis", tags=["vocal_analysis"])
app.include_router(logs_router, prefix="/api/logs", tags=["logs"])
app.include_router(email_reset_router, prefix="/api/email", tags=["email"])
app.include_router(user_settings_router, prefix="/api/settings", tags=["settings"])

logger = logging.getLogger("uvicorn.error")

@app.exception_handler(StarletteHTTPException)
async def general_http_exception_handler(request: Request, exception: StarletteHTTPException):
    if exception.status_code >= 500:
        logger.error(f"Server error on {request.url.path}: {exception.detail}")
    message = exception.detail if exception.detail else "An error occurred."
    return JSONResponse(
        status_code=exception.status_code,
        content={"detail": message},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exception: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exception.errors()},
    )