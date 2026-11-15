from typing import Dict, Optional, Any, List
from pydantic import BaseModel, Field

class MissionConfigRequest(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=2)
    mission_identifier: str = Field(..., min_length=2)
    footprint_diameter_m: float = Field(..., ge=20.0, le=1000.0)
    max_acceptable_slope: float = Field(..., ge=2.0, le=45.0)
    min_illumination_req: float = Field(..., ge=0.0, le=100.0)
    max_hazard_tolerance: float = Field(..., ge=0.01, le=1.0)
    mission_duration_days: int = Field(..., ge=1, le=1000)
    require_earth_los: bool = False
    weights: Optional[Dict[str, float]] = None

class MissionConfigResponse(BaseModel):
    id: str
    name: str
    mission_identifier: str
    footprint_diameter_m: float
    max_acceptable_slope: float
    min_illumination_req: float
    max_hazard_tolerance: float
    mission_duration_days: int
    require_earth_los: bool
    weights: Dict[str, float]
    created_at: Optional[str] = None
