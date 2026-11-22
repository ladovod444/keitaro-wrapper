from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, nullable=False, default=1)
    domain_id = Column(Integer, nullable=False, default=1)
    traffic_source_id = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())