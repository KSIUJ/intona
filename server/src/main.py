from contextlib import asynccontextmanager

from fastapi import FastAPI, status, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlmodel import SQLModel
import logging

from src.database import engine
from src.auth.router import router as auth_router
from src.exercises.router import router as exercise_router
from src.stats.router import router as stats_router
from src.vocal_analysis.router import router as vocal_analysis_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
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
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,  
        content={"detail": exception.errors()},
    )

