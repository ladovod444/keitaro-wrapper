def test_get_settings_returns_defaults(client, default_settings):
    resp = client.get("/api/settings/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["group_id"] == 1
    assert data["domain_id"] == 1
    assert data["traffic_source_id"] == 1
    assert "id" in data


def test_update_settings_persists(client, default_settings):
    resp = client.put("/api/settings/", json={"group_id": 42, "domain_id": 7})
    assert resp.status_code == 200
    assert resp.json()["group_id"] == 42
    assert resp.json()["domain_id"] == 7

    # Проверяем, что значение реально сохранилось в БД, а не только в ответе
    assert client.get("/api/settings/").json()["group_id"] == 42


def test_partial_update_does_not_reset_other_fields(client, default_settings):
    client.put("/api/settings/", json={"group_id": 42})
    data = client.get("/api/settings/").json()
    assert data["group_id"] == 42
    assert data["domain_id"] == 1  # не затёрто


def test_settings_validation_rejects_string(client, default_settings):
    resp = client.put("/api/settings/", json={"group_id": "not-a-number"})
    assert resp.status_code == 422