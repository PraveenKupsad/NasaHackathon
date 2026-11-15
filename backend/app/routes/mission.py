import uuid
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.mission import MissionConfigRequest, MissionConfigResponse
from app.models.site import EvaluationResult
from app.database import save_mission_config, get_all_mission_configs
from app.services.dataset_service import DatasetService
from app.services.scoring_engine import ScoringEngine

router = APIRouter(prefix="/api/mission", tags=["Mission Planner"])

@router.post("/configure")
def configure_mission(req: MissionConfigRequest):
    cfg_id = req.id or f"msn-{uuid.uuid4().hex[:8]}"
    weights = req.weights or {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }

    config_data = {
        "id": cfg_id,
        "name": req.name,
        "mission_identifier": req.mission_identifier,
        "footprint_diameter_m": req.footprint_diameter_m,
        "max_acceptable_slope": req.max_acceptable_slope,
        "min_illumination_req": req.min_illumination_req,
        "max_hazard_tolerance": req.max_hazard_tolerance,
        "mission_duration_days": req.mission_duration_days,
        "require_earth_los": req.require_earth_los,
        "weights": weights
    }
    
    # Save to SQLite
    save_mission_config(config_data)

    # Evaluate all sites under this mission configuration
    all_sites = DatasetService.get_sites()
    evaluations = [
        ScoringEngine.evaluate_site(
            site=s,
            weights=weights,
            max_slope_deg=req.max_acceptable_slope,
            min_illumination_pct=req.min_illumination_req,
            max_hazard_tolerance=req.max_hazard_tolerance,
            landing_footprint_m=req.footprint_diameter_m,
            require_earth_los=req.require_earth_los
        )
        for s in all_sites
    ]
    evaluations.sort(key=lambda x: x.final_score, reverse=True)

    passing_count = sum(1 for e in evaluations if not e.exclusion.is_excluded)

    return {
        "config": config_data,
        "evaluations_count": len(evaluations),
        "passing_sites_count": passing_count,
        "evaluations": evaluations
    }

@router.get("/configs", response_model=List[MissionConfigResponse])
def list_configs():
    return get_all_mission_configs()
