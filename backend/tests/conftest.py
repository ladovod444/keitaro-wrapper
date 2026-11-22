import os
import contextlib

# Подменяем окружение ДО импорта приложения
os.environ["KEITARO_URL"] = "http://keitaro.test"
os.environ["KEITARO_API_KEY"] = "test-api-key"
os.environ["DATABASE_URL"] = "sqlite:///./test_local.db"

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    # TestClient запускает lifespan -> init_db() создаёт таблицы
    with TestClient(app) as c:
        yield c
    with contextlib.suppress(FileNotFoundError):
        os.remove("test_local.db")


@pytest.fixture
def default_settings(client):
    """Сбрасываем настройки к дефолту перед каждым тестом"""
    payload = {"group_id": 1, "domain_id": 1, "traffic_source_id": 1}
    client.put("/api/settings/", json=payload)
    return payload


@pytest.fixture
def mock_keitaro(monkeypatch):
    """Мок клиента Keitaro: ничего не отправляем в реальный трекер"""
    from app.api.routes import campaigns as campaigns_module

    calls = {}

    async def fake_create_campaign(payload):
        calls["create_payload"] = payload
        return {"id": 777, **payload}

    async def fake_get_campaign(campaign_id):
        calls["get_campaign_id"] = campaign_id
        return {
            "id": campaign_id,
            "name": "Test Campaign",
            "alias": "test-campaign",
            "type": "position",
            "state": "active",
            "domain_id": 1,
            "group_id": 1,
            "traffic_source_id": 1,
        }

    async def fake_get_campaign_streams(campaign_id):
        return [
            {"id": 1, "schema": "redirect", "action_type": "http", "filters": []},
            {
                "id": 2,
                "schema": "landings",
                "action_type": "http",
                "offers": [{"offer_id": 10, "share": 100, "state": "active"}],
                "filters": [],
            },
        ]

    async def fake_get_all_campaigns():
        return [
            {"id": 1, "name": "C1", "group_id": 1, "state": "active"},
            {"id": 2, "name": "C2", "group_id": 2, "state": "active"},
        ]

    async def fake_update_campaign(campaign_id, payload):
        calls["update_payload"] = payload
        return {"id": campaign_id, **payload}

    client_obj = campaigns_module.keitaro_client
    monkeypatch.setattr(client_obj, "create_campaign", fake_create_campaign)
    monkeypatch.setattr(client_obj, "get_campaign", fake_get_campaign)
    monkeypatch.setattr(client_obj, "get_campaign_streams", fake_get_campaign_streams)
    monkeypatch.setattr(client_obj, "get_all_campaigns", fake_get_all_campaigns)
    monkeypatch.setattr(client_obj, "update_campaign", fake_update_campaign)

    return calls