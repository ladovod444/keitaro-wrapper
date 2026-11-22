from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CampaignCreateRequest(BaseModel):
    name: str
    alias: str
    geo_code: str
    offer_id: int
    domain_id: int
    group_id: int
    traffic_source_id: int

class CampaignUpdateRequest(BaseModel):
    streams: List[Dict[str, Any]]