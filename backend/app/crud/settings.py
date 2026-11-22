from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import UserSettings
from app.schemas.settings import UserSettingsCreate, UserSettingsUpdate

async def get_settings(db: AsyncSession) -> UserSettings:
    """Получить настройки пользователя (создать дефолтные, если их нет)"""
    result = await db.execute(select(UserSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        # Создаем дефолтные настройки
        settings = UserSettings(group_id=1, domain_id=1, traffic_source_id=1)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings

async def update_settings(db: AsyncSession, settings_data: UserSettingsUpdate) -> UserSettings:
    """Обновить настройки пользователя"""
    settings = await get_settings(db)

    update_data = settings_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)

    await db.commit()
    await db.refresh(settings)
    return settings