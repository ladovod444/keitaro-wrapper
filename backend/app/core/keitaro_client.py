import logging
from typing import Any, Optional

import httpx

from app.core.config import settings
from app.core.exceptions import (
    KeitaroAuthError,
    KeitaroError,
    KeitaroNotFound,
    KeitaroUnavailable,
    KeitaroValidationError,
)

logger = logging.getLogger(__name__)


class KeitaroClient:
    def __init__(self, base_url: str, api_key: str, timeout: float = 15.0):
        self._base_url = base_url.rstrip("/") + "/admin_api/v1/"
        self._api_key = api_key
        self._timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        """Ленивая инициализация: пул соединений создаётся внутри event loop."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                headers={"Api-Key": self._api_key, "Content-Type": "application/json"},
                timeout=httpx.Timeout(self._timeout),
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None

    async def _request(self, method: str, path: str, *, json: Any = None) -> Any:
        client = self._get_client()
        try:
            response = await client.request(method, path, json=json)
        except httpx.TimeoutException as exc:
            logger.warning("Keitaro timeout: %s %s", method, path)
            raise KeitaroUnavailable("Keitaro не ответил вовремя") from exc
        except httpx.HTTPError as exc:
            # str(exc) может содержать URL, но не заголовки — ключ не утекает
            logger.warning("Keitaro transport error: %s %s: %s", method, path, exc)
            raise KeitaroUnavailable("Keitaro недоступен") from exc

        if response.status_code >= 400:
            raise self._build_error(response, method, path)

        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    def _build_error(self, response: httpx.Response, method: str, path: str) -> KeitaroError:
        status = response.status_code
        try:
            details = response.json()
        except ValueError:
            details = None

        # тело ограничиваем: не заливаем логи мегабайтами HTML от nginx
        logger.error(
            "Keitaro API error %s: %s %s | body=%s",
            status, method, path, response.text[:500],
        )

        if status in (401, 403):
            return KeitaroAuthError(
                "Keitaro отклонил API-ключ. Проверьте KEITARO_API_KEY на сервере.",
                details=details, upstream_status=status,
            )
        if status == 404:
            return KeitaroNotFound(
                "Ресурс не найден в Keitaro", details=details, upstream_status=status
            )
        if status in (400, 422):
            return KeitaroValidationError(
                "Keitaro отклонил данные", details=details, upstream_status=status
            )
        return KeitaroUnavailable(
            f"Ошибка Keitaro ({status})", details=details, upstream_status=status
        )

    # --- публичные методы: тонкие обёртки, ошибок не глотают ---

    async def get_all_campaigns(self) -> list:
        return await self._request("GET", "campaigns")

    async def create_campaign(self, payload: dict) -> dict:
        return await self._request("POST", "campaigns", json=payload)

    async def get_campaign(self, campaign_id: int) -> dict:
        return await self._request("GET", f"campaigns/{campaign_id}")

    async def update_campaign(self, campaign_id: int, payload: dict) -> dict:
        return await self._request("PUT", f"campaigns/{campaign_id}", json=payload)

    async def get_campaign_streams(self, campaign_id: int) -> list:
        return await self._request("GET", f"campaigns/{campaign_id}/streams")


keitaro_client = KeitaroClient(settings.keitaro_url, settings.keitaro_api_key)