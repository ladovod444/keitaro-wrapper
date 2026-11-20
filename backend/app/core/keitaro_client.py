import httpx
from typing import Dict, Any
from app.core.config import settings


class KeitaroClient:
    def __init__(self):
        self.base_url = f"{settings.keitaro_url}/admin_api/v1"
        self.headers = {
            "Api-Key": settings.keitaro_api_key,
            "Content-Type": "application/json"
        }

    async def create_campaign(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/campaigns"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)

            # Если ошибка (4xx или 5xx), выводим детальный ответ от Keitaro
            if response.status_code >= 400:
                print(f"❌ KEITARO API ERROR {response.status_code}:")
                print(response.text)  # <-- Здесь будет написано, какое поле неверно!
                raise Exception(f"Keitaro API Error: {response.text}")

            return response.json()

    async def get_campaign(self, campaign_id: int) -> Dict[str, Any]:
        url = f"{self.base_url}/campaigns/{campaign_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code >= 400:
                print(f"❌ KEITARO API ERROR {response.status_code}: {response.text}")
                raise Exception(f"Keitaro API Error: {response.text}")
            return response.json()

    async def get_campaign_streams(self, campaign_id: int) -> list:
        """Получение потоков кампании отдельным запросом"""
        url = f"{self.base_url}/campaigns/{campaign_id}/streams"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code >= 400:
                print(f"❌ KEITARO STREAMS ERROR {response.status_code}: {response.text}")
                return [] # Возвращаем пустой список, если ошибка
            return response.json()

    async def update_campaign(self, campaign_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/campaigns/{campaign_id}"
        async with httpx.AsyncClient() as client:
            response = await client.put(url, json=payload, headers=self.headers)
            if response.status_code >= 400:
                print(f"❌ KEITARO API ERROR {response.status_code}: {response.text}")
                raise Exception(f"Keitaro API Error: {response.text}")
            return response.json()

    async def get_all_campaigns(self) -> list:
        """Получение списка всех кампаний"""
        url = f"{self.base_url}/campaigns"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code >= 400:
                print(f"❌ KEITARO API ERROR {response.status_code}: {response.text}")
                return []
            return response.json()


keitaro_client = KeitaroClient()