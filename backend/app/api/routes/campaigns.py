from fastapi import APIRouter
from app.core.keitaro_client import keitaro_client
from app.schemas.campaign import CampaignCreateRequest, CampaignUpdateRequest

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])

@router.get("/")
async def list_campaigns():
    return await keitaro_client.get_all_campaigns()

@router.post("/")
async def create_campaign(data: CampaignCreateRequest):
    payload = {
        "name": data.name,
        "alias": data.alias,
        "type": "position",
        "state": "active",
        "domain_id": data.domain_id,
        "group_id": data.group_id,
        "traffic_source_id": data.traffic_source_id,
        "streams": [
            {
                "name": f"Google Traffic ({data.geo_code})",
                "type": "regular",
                "position": 1,
                "schema": "redirect",
                "action_type": "http",  # Метод редиректа на URL (http, curl, js, meta)
                "action_payload": "https://google.com",
                "filters": [
                    {
                        "name": "country",
                        "mode": "accept",
                        "payload": [
                            data.geo_code.upper()
                        ]
                    }
                ]
            },
            {
                "name": "Main Offer Traffic",
                "type": "regular",
                "position": 2,
                "schema": "landings",
                "action_type": "http",  # Тип редиректа для перехода на оффер
                "offers": [
                    {
                        "offer_id": int(data.offer_id),
                        "share": 100,
                        "state": "active"
                    }
                ],
                "filters": []
            }
        ]
    }

    result = await keitaro_client.create_campaign(payload)
    return {"status": "success", "data": result}

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: int):
    campaign = await keitaro_client.get_campaign(campaign_id)
    # GET /campaigns/{id} в Keitaro не отдаёт streams — добираем отдельно
    campaign["streams"] = await keitaro_client.get_campaign_streams(campaign_id)
    return campaign

@router.put("/{campaign_id}")
async def update_campaign(campaign_id: int, data: CampaignUpdateRequest):
    current = await keitaro_client.get_campaign(campaign_id)
    payload = {
        "name": current.get("name"),
        "alias": current.get("alias"),
        "type": current.get("type", "position"),
        "state": current.get("state", "active"),
        "domain_id": current.get("domain_id"),
        "group_id": current.get("group_id"),
        "traffic_source_id": current.get("traffic_source_id"),
        "streams": data.streams,
    }
    return {"status": "success", "data": await keitaro_client.update_campaign(campaign_id, payload)}

