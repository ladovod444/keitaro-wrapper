from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class UserSettingsBase(BaseModel):
    group_id: int = 1
    domain_id: int = 1
    traffic_source_id: int = 1

class UserSettingsCreate(UserSettingsBase):
    pass

class UserSettingsUpdate(BaseModel):
    group_id: Optional[int] = None
    domain_id: Optional[int] = None
    traffic_source_id: Optional[int] = None

class UserSettingsResponse(UserSettingsBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Новый синтаксис для from_attributes в Pydantic V2
    model_config = ConfigDict(from_attributes=True)