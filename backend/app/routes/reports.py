import io
import csv
from fastapi import APIRouter, HTTPException, Response
from app.services.dataset_service import DatasetService
from app.services.scoring_engine import ScoringEngine
from app.services.terrain_service import TerrainService
from app.services.illumination_service import IlluminationService
from app.services.hazard_service import HazardService

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{site_id}")
def generate_site_report(site_id: str):
    site = DatasetService.get_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Site '{site_id}' not found")

    default_weights = {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }
    evaluation = ScoringEngine.evaluate_site(site=site, weights=default_weights)
    terrain_clearance = TerrainService.evaluate_clearance_envelope(site)
    solar_summary = IlluminationService.get_solar_summary(site)
    hazard_breakdown = HazardService.get_hazard_breakdown(site)
    datasets = DatasetService.get_datasets()

    return {
        "report_id": f"REP-LUNA-{site.code}-2026",
        "generated_at_utc": "2026-11-15T16:00:00Z",
        "mission_identifier": "LUNA-SOUTH-POLE-2026",
        "site_identifier": site.id,
        "site_code": site.code,
        "site_name": site.name,
        "region": site.region,
        "coordinates": {
            "latitude": site.lat,
            "longitude": site.lon,
            "coordinate_reference_system": "IAU Moon 2000 / Lunar Polar Stereographic (EPSG:75400)"
        },
        "suitability_score": evaluation.final_score,
        "weighted_raw_score": evaluation.weighted_score,
        "risk_classification": evaluation.risk_classification,
        "recommendation": evaluation.recommendation,
        "recommendation_reasoning": evaluation.recommendation_summary,
        "hard_constraint_results": {
            "status": "EXCLUDED" if evaluation.exclusion.is_excluded else "PASS",
            "is_excluded": evaluation.exclusion.is_excluded,
            "violations": evaluation.exclusion.reasons,
            "slope_check": "FAIL" if evaluation.exclusion.slope_exceeded else "PASS",
            "hazard_check": "FAIL" if evaluation.exclusion.hazard_exceeded else "PASS",
            "clearance_check": "FAIL" if evaluation.exclusion.clearance_insufficient else "PASS",
            "illumination_check": "FAIL" if evaluation.exclusion.illumination_insufficient else "PASS"
        },
        "factor_breakdown": {
            "slope_suitability_score": evaluation.factor_scores.slope_score,
            "terrain_safety_score": evaluation.factor_scores.terrain_safety_score,
            "illumination_score": evaluation.factor_scores.illumination_score,
            "crater_avoidance_score": evaluation.factor_scores.crater_avoidance_score,
            "accessibility_score": evaluation.factor_scores.accessibility_score
        },
        "terrain_assessment": {
            "elevation_m": site.elevation_m,
            "slope_mean_deg": site.slope_mean_deg,
            "slope_max_deg": site.slope_max_deg,
            "surface_roughness_m": site.surface_roughness_m,
            "landing_clearance_m": site.landing_clearance_m,
            "clearance_envelope": terrain_clearance
        },
        "illumination_assessment": {
            "annual_illumination_fraction": site.illumination_annual_pct,
            "summer_solstice_peak_fraction": site.illumination_summer_pct,
            "solar_summary": solar_summary
        },
        "hazard_assessment": hazard_breakdown,
        "data_confidence": {
            "confidence_pct": site.data_confidence_pct,
            "rating": evaluation.confidence_level,
            "provenance_flags": site.provenance.model_dump()
        },
        "dataset_references": datasets
    }

@router.get("/export/csv")
def export_csv_summary():
    sites = DatasetService.get_sites()
    default_weights = {
        "slope": 0.30,
        "terrain": 0.25,
        "illumination": 0.20,
        "crater_avoidance": 0.15,
        "accessibility": 0.10
    }
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Site ID", "Code", "Name", "Region", "Latitude (deg)", "Longitude (deg)",
        "Elevation (m)", "Mean Slope (deg)", "Max Slope (deg)", "Roughness (m)",
        "Annual Illum (%)", "Summer Illum (%)", "Earth LOS (%)", "Nearest Crater",
        "Crater Dist (km)", "Hazard Density", "Clearance (m)", "Data Confidence (%)",
        "Weighted Score", "Final Score", "Exclusion Status", "Exclusion Reasons",
        "Risk Class", "Recommendation"
    ])
    
    for s in sites:
        ev = ScoringEngine.evaluate_site(s, default_weights)
        writer.writerow([
            s.id, s.code, s.name, s.region, s.lat, s.lon,
            s.elevation_m, s.slope_mean_deg, s.slope_max_deg, s.surface_roughness_m,
            s.illumination_annual_pct, s.illumination_summer_pct, s.earth_los_pct,
            s.nearest_crater, s.crater_proximity_km, s.hazard_density,
            s.landing_clearance_m, s.data_confidence_pct,
            ev.weighted_score, ev.final_score,
            "EXCLUDED" if ev.exclusion.is_excluded else "PASSED",
            "; ".join(ev.exclusion.reasons) if ev.exclusion.reasons else "None",
            ev.risk_classification, ev.recommendation
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=luna_nav_site_evaluations.csv"}
    )
