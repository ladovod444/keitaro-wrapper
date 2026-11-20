from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.routes import campaigns, settings
from app.db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Инициализация БД при старте
    await init_db()
    yield

app = FastAPI(title="Keitaro Wrapper API", lifespan=lifespan)

# Разрешаем запросы с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns.router)
app.include_router(settings.router)

@app.get("/")
def read_root():
    return {"message": "Keitaro Wrapper API is running"}