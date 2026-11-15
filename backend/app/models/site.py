from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class SiteProvenance(BaseModel):
    topography: str
    illumination: str
    micro_relief: str

class Site(BaseModel):
    id: str
    name: str
    region: str
    code: str
    lat: float
    lon: float
    elevation_m: float
    slope_mean_deg: float
    slope_max_deg: float
    surface_roughness_m: float
    illumination_annual_pct: float
    illumination_summer_pct: float
    earth_los_pct: float
    crater_proximity_km: float
    nearest_crater: str
    hazard_density: float
    landing_clearance_m: float
    data_confidence_pct: float
    provenance: SiteProvenance
    description: str

class FactorScores(BaseModel):
    slope_score: float = Field(..., ge=0, le=100)
    terrain_safety_score: float = Field(..., ge=0, le=100)
    illumination_score: float = Field(..., ge=0, le=100)
    crater_avoidance_score: float = Field(..., ge=0, le=100)
    accessibility_score: float = Field(..., ge=0, le=100)

class ExclusionResult(BaseModel):
    is_excluded: bool
    reasons: List[str]
    slope_exceeded: bool = False
    hazard_exceeded: bool = False
    clearance_insufficient: bool = False
    illumination_insufficient: bool = False
    earth_los_lost: bool = False
    data_confidence_low: bool = False

class EvaluationResult(BaseModel):
    site: Site
    factor_scores: FactorScores
    weighted_score: float = Field(..., ge=0, le=100)
    final_score: float = Field(..., ge=0, le=100)
    exclusion: ExclusionResult
    risk_classification: str # "NOMINAL", "CAUTION", "HIGH_RISK", "UNACCEPTABLE"
    recommendation: str
    recommendation_summary: str
    confidence_level: str
    provenance_status: str

class AnalyzeRequest(BaseModel):
    site_ids: Optional[List[str]] = None
    weights: Optional[Dict[str, float]] = None
    max_slope_deg: Optional[float] = 10.0
    min_illumination_pct: Optional[float] = 20.0
    max_hazard_tolerance: Optional[float] = 0.50
    landing_footprint_m: Optional[float] = 100.0
    require_earth_los: Optional[bool] = False

class ComparisonRequest(BaseModel):
    site_ids: List[str] = Field(..., min_length=2)
    weights: Optional[Dict[str, float]] = None
    max_slope_deg: Optional[float] = 10.0
    min_illumination_pct: Optional[float] = 20.0
    max_hazard_tolerance: Optional[float] = 0.50
    landing_footprint_m: Optional[float] = 100.0

class ComparisonResponse(BaseModel):
    sites: List[EvaluationResult]
    recommended_site_id: Optional[str]
    recommendation_rationale: str
    tradeoff_matrix: Dict[str, Any]
