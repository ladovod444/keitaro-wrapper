from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import campaigns, settings
from app.core.exceptions import KeitaroError
from app.core.keitaro_client import keitaro_client
from app.db.database import init_db
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await keitaro_client.aclose()

app = FastAPI(title="Keitaro Wrapper API", lifespan=lifespan)

# 1. Сначала CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Потом роутеры
app.include_router(campaigns.router)
app.include_router(settings.router)

# 3. Потом глобальные обработчики ошибок
@app.exception_handler(KeitaroError)
async def keitaro_error_handler(request: Request, exc: KeitaroError):
    logger.warning("%s %s -> %s: %s", request.method, request.url.path, exc.status_code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "errors": exc.details,
            "upstream_status": exc.upstream_status,
        },
    )

@app.get("/")
def read_root():
    return {"message": "Keitaro Wrapper API is running"}