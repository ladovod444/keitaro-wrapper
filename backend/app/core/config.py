from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    keitaro_url: str
    keitaro_api_key: str
    database_url: str

    # Новый синтаксис конфигурации для Pydantic V2
    model_config = ConfigDict(env_file=".env")

settings = Settings()