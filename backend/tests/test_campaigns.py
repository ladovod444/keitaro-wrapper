VALID_REQUEST = {
    "name": "Test Campaign",
    "alias": "test-campaign",
    "geo_code": "ru",
    "offer_id": 10,
    "domain_id": 1,
    "group_id": 1,
    "traffic_source_id": 1,
}


def test_list_campaigns(client, mock_keitaro):
    resp = client.get("/api/campaigns/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_create_campaign_returns_id(client, mock_keitaro):
    resp = client.post("/api/campaigns/", json=VALID_REQUEST)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == 777


def test_create_campaign_payload_uses_correct_keitaro_fields(client, mock_keitaro):
    """Регрессия: Keitaro требует 'state' и 'traffic_source_id',
    а не 'status' / 'source_id'."""
    client.post("/api/campaigns/", json=VALID_REQUEST)
    payload = mock_keitaro["create_payload"]

    assert payload["state"] == "active"
    assert "status" not in payload
    assert payload["traffic_source_id"] == 1
    assert "source_id" not in payload
    assert payload["type"] == "position"


def test_create_campaign_builds_two_streams(client, mock_keitaro):
    client.post("/api/campaigns/", json=VALID_REQUEST)
    streams = mock_keitaro["create_payload"]["streams"]

    assert len(streams) == 2

    geo_stream, offer_stream = streams
    assert geo_stream["position"] < offer_stream["position"]

    # Первый поток: редирект на Google по гео
    assert geo_stream["schema"] == "redirect"
    assert geo_stream["action_type"] == "http"
    assert geo_stream["action_payload"] == "https://google.com"
    assert geo_stream["filters"] == [
        {"name": "country", "mode": "accept", "payload": ["RU"]}
    ]

    # Второй поток: ловит остальных и отправляет на оффер
    assert offer_stream["filters"] == []
    assert offer_stream["offers"] == [
        {"offer_id": 10, "share": 100, "state": "active"}
    ]


def test_geo_code_is_uppercased(client, mock_keitaro):
    client.post("/api/campaigns/", json={**VALID_REQUEST, "geo_code": "de"})
    geo_stream = mock_keitaro["create_payload"]["streams"][0]
    assert geo_stream["filters"][0]["payload"] == ["DE"]


def test_create_campaign_requires_all_fields(client, mock_keitaro):
    resp = client.post("/api/campaigns/", json={"name": "Incomplete"})
    assert resp.status_code == 422


def test_get_campaign_includes_streams(client, mock_keitaro):
    """Регрессия: GET /campaigns/{id} в Keitaro НЕ отдаёт streams,
    наш бэкенд должен подшить их отдельным запросом."""
    resp = client.get("/api/campaigns/777")
    assert resp.status_code == 200
    data = resp.json()
    assert "streams" in data
    assert len(data["streams"]) == 2
    assert data["streams"][1]["offers"][0]["offer_id"] == 10


def test_update_campaign_keeps_metadata(client, mock_keitaro):
    new_streams = [{"id": 2, "schema": "landings", "offers": []}]
    resp = client.put("/api/campaigns/777", json={"streams": new_streams})

    assert resp.status_code == 200
    payload = mock_keitaro["update_payload"]
    assert payload["streams"] == new_streams
    # Метаданные не потеряны и read-only поля не отправляются
    assert payload["name"] == "Test Campaign"
    assert "id" not in payload
    assert "token" not in payload