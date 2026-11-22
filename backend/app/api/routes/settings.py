from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.crud.settings import get_settings, update_settings
from app.schemas.settings import UserSettingsUpdate, UserSettingsResponse

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/", response_model=UserSettingsResponse)
async def read_settings(db: AsyncSession = Depends(get_db)):
    """Получить настройки пользователя"""
    return await get_settings(db)

@router.put("/", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_data: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Обновить настройки пользователя"""
    return await update_settings(db, settings_data)