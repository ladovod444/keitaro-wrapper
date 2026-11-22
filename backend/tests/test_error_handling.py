import asyncio

import httpx
import pytest

from app.core.exceptions import (
    KeitaroAuthError, KeitaroNotFound, KeitaroUnavailable, KeitaroValidationError,
)
from app.core.keitaro_client import KeitaroClient


def make_client(handler):
    client = KeitaroClient("http://keitaro.test", "test-key")
    client._client = httpx.AsyncClient(
        base_url="http://keitaro.test/admin_api/v1/",
        transport=httpx.MockTransport(handler),
    )
    return client


@pytest.mark.parametrize(
    "upstream,expected",
    [
        (401, KeitaroAuthError),
        (403, KeitaroAuthError),
        (404, KeitaroNotFound),
        (422, KeitaroValidationError),
        (500, KeitaroUnavailable),
    ],
)
def test_status_is_mapped_to_typed_error(upstream, expected):
    client = make_client(lambda req: httpx.Response(upstream, json={"error": "x"}))
    with pytest.raises(expected) as exc:
        asyncio.run(client.get_all_campaigns())
    assert exc.value.upstream_status == upstream
    asyncio.run(client.aclose())


def test_streams_error_is_not_swallowed():
    """Регрессия: раньше ошибка превращалась в [], и UI показывал «офферов нет»."""
    client = make_client(lambda req: httpx.Response(500, text="boom"))
    with pytest.raises(KeitaroUnavailable):
        asyncio.run(client.get_campaign_streams(1))
    asyncio.run(client.aclose())


def test_timeout_is_mapped_to_unavailable():
    def handler(req):
        raise httpx.ConnectTimeout("timeout", request=req)

    client = make_client(handler)
    with pytest.raises(KeitaroUnavailable):
        asyncio.run(client.get_all_campaigns())
    asyncio.run(client.aclose())


def test_auth_error_is_not_401_for_our_client():
    client = make_client(lambda req: httpx.Response(401, json={}))
    with pytest.raises(KeitaroAuthError) as exc:
        asyncio.run(client.get_all_campaigns())
    assert exc.value.status_code == 502  # не 401!
    asyncio.run(client.aclose())


def test_client_reuses_connection_pool():
    client = make_client(lambda req: httpx.Response(200, json=[]))

    async def two_calls():
        await client.get_all_campaigns()
        first = client._client
        await client.get_all_campaigns()
        assert client._client is first
        await client.aclose()

    asyncio.run(two_calls())