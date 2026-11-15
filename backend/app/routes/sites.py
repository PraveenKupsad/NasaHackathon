from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.services.dataset_service import DatasetService
from app.services.scoring_engine import ScoringEngine
from app.services.terrain_service import TerrainService
from app.services.illumination_service import IlluminationService
from app.services.hazard_service import HazardService
from app.models.site import Site, EvaluationResult

router = APIRouter(prefix="/api/sites", tags=["Sites"])

@router.get("", response_model=List[EvaluationResult])
def list_sites(
    max_slope: float = Query(10.0, description="Max acceptable slope degrees"),
    min_illum: float = Query(20.0, description="Min acceptable annual illumination %"),
    max_hazard: float = Query(0.50, description="Max hazard density tolerance"),
    footprint: float = Query(100.0, description="Landing footprint diameter meters")
):
    sites = DatasetService.get_sites()
    default_weights = {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }
    results = [
        ScoringEngine.evaluate_site(
            site=s,
            weights=default_weights,
            max_slope_deg=max_slope,
            min_illumination_pct=min_illum,
            max_hazard_tolerance=max_hazard,
            landing_footprint_m=footprint
        )
        for s in sites
    ]
    # Sort by final score descending
    results.sort(key=lambda x: x.final_score, reverse=True)
    return results

@router.get("/{site_id}")
def get_site_detail(site_id: str):
    site = DatasetService.get_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Site '{site_id}' not found in lunar database")

    default_weights = {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }
    evaluation = ScoringEngine.evaluate_site(site=site, weights=default_weights)
    elevation_profile = TerrainService.generate_elevation_profile(site)
    slope_distribution = TerrainService.generate_slope_distribution(site)
    clearance_envelope = TerrainService.evaluate_clearance_envelope(site)
    solar_timeline = IlluminationService.generate_annual_timeline(site)
    solar_summary = IlluminationService.get_solar_summary(site)
    hazard_breakdown = HazardService.get_hazard_breakdown(site)

    return {
        "site": site,
        "evaluation": evaluation,
        "elevation_profile": elevation_profile,
        "slope_distribution": slope_distribution,
        "clearance_envelope": clearance_envelope,
        "solar_timeline": solar_timeline,
        "solar_summary": solar_summary,
        "hazard_breakdown": hazard_breakdown
    }
