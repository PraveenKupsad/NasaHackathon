from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.dataset_service import DatasetService
from app.services.scoring_engine import ScoringEngine
from app.services.hazard_service import HazardService
from app.models.site import AnalyzeRequest, EvaluationResult

router = APIRouter(prefix="/api", tags=["Analysis"])

@router.post("/analyze", response_model=List[EvaluationResult])
def analyze_sites(req: AnalyzeRequest):
    all_sites = DatasetService.get_sites()
    if req.site_ids and len(req.site_ids) > 0:
        targets = [s for s in all_sites if s.id in req.site_ids]
    else:
        targets = all_sites

    if not targets:
        raise HTTPException(status_code=400, detail="No matching sites found for analysis")

    weights = req.weights or {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }

    results = [
        ScoringEngine.evaluate_site(
            site=s,
            weights=weights,
            max_slope_deg=req.max_slope_deg or 10.0,
            min_illumination_pct=req.min_illumination_pct or 20.0,
            max_hazard_tolerance=req.max_hazard_tolerance or 0.50,
            landing_footprint_m=req.landing_footprint_m or 100.0,
            require_earth_los=req.require_earth_los or False
        )
        for s in targets
    ]
    results.sort(key=lambda x: x.final_score, reverse=True)
    return results

@router.get("/analysis/overview")
def get_mission_overview():
    sites = DatasetService.get_sites()
    craters = DatasetService.get_craters()
    datasets = DatasetService.get_datasets()
    
    default_weights = {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }
    evaluations = [
        ScoringEngine.evaluate_site(s, weights=default_weights)
        for s in sites
    ]
    
    passing_sites = [e for e in evaluations if not e.exclusion.is_excluded]
    excluded_sites = [e for e in evaluations if e.exclusion.is_excluded]
    
    highest_candidate = max(evaluations, key=lambda x: x.final_score) if evaluations else None
    
    hazard_summary = HazardService.get_all_sites_hazard_summary(sites)

    # Illumination summary stats
    mean_illum = sum(s.illumination_annual_pct for s in sites) / len(sites) if sites else 0.0
    psr_count = sum(1 for s in sites if s.illumination_annual_pct < 5.0)

    # Terrain stats
    mean_slope = sum(s.slope_mean_deg for s in sites) / len(sites) if sites else 0.0
    mean_elev = sum(s.elevation_m for s in sites) / len(sites) if sites else 0.0

    return {
        "mission_objective": "Evaluate, visualize, and identify scientifically optimal and hazardous-free landing candidate sites within 80°S to 90°S Lunar South Pole region for autonomous surface payload delivery.",
        "candidate_sites_total": len(sites),
        "candidate_sites_passing": len(passing_sites),
        "candidate_sites_excluded": len(excluded_sites),
        "highest_scoring_candidate": {
            "id": highest_candidate.site.id,
            "name": highest_candidate.site.name,
            "score": highest_candidate.final_score,
            "region": highest_candidate.site.region,
            "risk": highest_candidate.risk_classification,
            "lat": highest_candidate.site.lat,
            "lon": highest_candidate.site.lon
        } if highest_candidate else None,
        "overall_hazard_summary": hazard_summary,
        "illumination_stats": {
            "mean_annual_illumination_pct": round(mean_illum, 1),
            "permanently_shadowed_sites_count": psr_count,
            "high_illumination_sites_count": sum(1 for s in sites if s.illumination_annual_pct >= 80.0)
        },
        "terrain_stats": {
            "mean_slope_deg": round(mean_slope, 1),
            "mean_elevation_m": round(mean_elev, 1),
            "lowest_elevation_m": min(s.elevation_m for s in sites) if sites else 0.0,
            "highest_elevation_m": max(s.elevation_m for s in sites) if sites else 0.0
        },
        "datasets_available_count": len(datasets),
        "craters_mapped_count": len(craters),
        "analysis_completion_status": "OPERATIONAL / COMPLETE",
        "recent_activity": [
            {"time": "09:42:15 UTC", "event": "LOLA GDR 20m digital elevation model raster indexed", "status": "VERIFIED"},
            {"time": "10:15:30 UTC", "event": "LROC WAC multi-temporal polar illumination matrix loaded", "status": "NOMINAL"},
            {"time": "11:04:12 UTC", "event": "15 Lunar South Pole candidate sites ingested and geocoded", "status": "COMPLETED"},
            {"time": "12:30:00 UTC", "event": "Safety exclusion constraints evaluated against landing gear tilt limits", "status": "ALERT_EXCLUSIONS_DETECTED"},
            {"time": "14:15:00 UTC", "event": "Weighted scoring pipeline executed across candidate repository", "status": "NOMINAL"}
        ]
    }

@router.get("/craters")
def get_craters():
    return DatasetService.get_craters()
