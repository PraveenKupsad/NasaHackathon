from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.dataset_service import DatasetService
from app.services.scoring_engine import ScoringEngine
from app.models.site import ComparisonRequest, ComparisonResponse, EvaluationResult

router = APIRouter(prefix="/api", tags=["Comparison"])

@router.post("/compare", response_model=ComparisonResponse)
def compare_sites(req: ComparisonRequest):
    if len(req.site_ids) < 2:
        raise HTTPException(status_code=400, detail="Comparison requires at least 2 candidate sites (3 recommended)")

    all_sites = DatasetService.get_sites()
    selected_sites = [s for s in all_sites if s.id in req.site_ids]

    if len(selected_sites) != len(req.site_ids):
        found_ids = {s.id for s in selected_sites}
        missing = set(req.site_ids) - found_ids
        raise HTTPException(status_code=404, detail=f"Sites not found: {missing}")

    weights = req.weights or {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }

    evaluations = [
        ScoringEngine.evaluate_site(
            site=s,
            weights=weights,
            max_slope_deg=req.max_slope_deg or 10.0,
            min_illumination_pct=req.min_illumination_pct or 20.0,
            max_hazard_tolerance=req.max_hazard_tolerance or 0.50,
            landing_footprint_m=req.landing_footprint_m or 100.0
        )
        for s in selected_sites
    ]

    # Rule: Do not recommend a site if it fails a mandatory exclusion rule!
    non_excluded_evals = [e for e in evaluations if not e.exclusion.is_excluded]

    if non_excluded_evals:
        # Highest scoring among non-excluded sites
        recommended_eval = max(non_excluded_evals, key=lambda x: x.final_score)
        rec_id = recommended_eval.site.id
        rationale = (
            f"Candidate '{recommended_eval.site.name}' ({recommended_eval.site.code}) is recommended as the prime landing target with an operational score of {recommended_eval.final_score}/100. "
            f"It strictly satisfies all mandatory engineering constraints (Slope: {recommended_eval.site.slope_mean_deg}°, Clearance: {recommended_eval.site.landing_clearance_m}m) "
            f"while providing superior combined illumination ({recommended_eval.site.illumination_annual_pct}%) and direct Earth visibility ({recommended_eval.site.earth_los_pct}%)."
        )
    else:
        rec_id = None
        rationale = (
            "CRITICAL WARNING: None of the selected candidates pass mandatory safety exclusion criteria. "
            "No recommendation can be made among these targets due to active safety violations."
        )

    # Build factor-by-factor breakdown, strengths & weaknesses for each site
    site_profiles = {}
    for e in evaluations:
        strengths = []
        weaknesses = []
        
        if e.factor_scores.slope_score >= 80:
            strengths.append(f"Gentle terrain slopes (mean {e.site.slope_mean_deg}°)")
        else:
            weaknesses.append(f"Elevated slope gradient (mean {e.site.slope_mean_deg}°, peak {e.site.slope_max_deg}°)")

        if e.factor_scores.illumination_score >= 80:
            strengths.append(f"Superb solar energy availability ({e.site.illumination_annual_pct}% annual)")
        elif e.site.illumination_annual_pct < 20:
            weaknesses.append("Severe darkness / cryo-cold trap conditions")

        if e.site.landing_clearance_m >= 110:
            strengths.append(f"Expansive landing clearance ({e.site.landing_clearance_m}m flat radius)")
        elif e.site.landing_clearance_m < 80:
            weaknesses.append(f"Constrained landing clearance ({e.site.landing_clearance_m}m radius)")

        if e.site.earth_los_pct >= 85:
            strengths.append(f"High direct Earth visibility ({e.site.earth_los_pct}%)")

        if e.exclusion.is_excluded:
            weaknesses.append(f"EXCLUSION VIOLATION: {'; '.join(e.exclusion.reasons)}")

        site_profiles[e.site.id] = {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "radar_factors": [
                {"factor": "Slope Suitability", "score": e.factor_scores.slope_score},
                {"factor": "Terrain Safety", "score": e.factor_scores.terrain_safety_score},
                {"factor": "Illumination", "score": e.factor_scores.illumination_score},
                {"factor": "Crater Avoidance", "score": e.factor_scores.crater_avoidance_score},
                {"factor": "Accessibility", "score": e.factor_scores.accessibility_score}
            ]
        }

    return ComparisonResponse(
        sites=evaluations,
        recommended_site_id=rec_id,
        recommendation_rationale=rationale,
        tradeoff_matrix=site_profiles
    )
