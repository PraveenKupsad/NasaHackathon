from typing import Dict, List, Any
from app.models.site import Site

class HazardService:
    """
    Hazard & Safety Service:
    Quantifies terrain hazards including slopes > tipping limits, meter-scale boulder clusters,
    crater rim drop-offs, and micro-roughness.
    """

    @staticmethod
    def get_hazard_breakdown(site: Site) -> Dict[str, Any]:
        """
        Detailed hazard category risks.
        """
        slope_risk = "HIGH" if site.slope_mean_deg > 8.0 else "MODERATE" if site.slope_mean_deg > 5.0 else "LOW"
        boulder_risk = "HIGH" if site.hazard_density > 0.40 else "MODERATE" if site.hazard_density > 0.20 else "LOW"
        crater_risk = "CRITICAL" if site.crater_proximity_km < 1.0 else "MODERATE" if site.crater_proximity_km < 3.0 else "MINIMAL"
        
        composite_hazard_index = round(
            (min(1.0, site.slope_mean_deg / 15.0) * 0.4) +
            (site.hazard_density * 0.35) +
            (max(0.0, 1.0 - (site.crater_proximity_km / 5.0)) * 0.25),
            2
        )

        return {
            "composite_hazard_index": composite_hazard_index,
            "overall_hazard_level": "CRITICAL" if composite_hazard_index > 0.6 else "ELEVATED" if composite_hazard_index > 0.35 else "NOMINAL",
            "slope_stability_risk": slope_risk,
            "boulder_impact_risk": boulder_risk,
            "rim_proximity_risk": crater_risk,
            "surface_roughness_rms_m": site.surface_roughness_m,
            "hazard_density_normalized": site.hazard_density,
            "tipping_angle_margin_deg": round(max(0.0, 15.0 - site.slope_max_deg), 1),
            "provenance": "REAL LOLA slopes + SIMULATED stochastic boulder hazard field"
        }

    @staticmethod
    def get_all_sites_hazard_summary(sites: List[Site]) -> Dict[str, Any]:
        """
        Aggregates hazard metrics across all candidate sites for mission overview.
        """
        nominal_count = 0
        elevated_count = 0
        critical_count = 0

        for s in sites:
            hz = HazardService.get_hazard_breakdown(s)
            lvl = hz["overall_hazard_level"]
            if lvl == "NOMINAL":
                nominal_count += 1
            elif lvl == "ELEVATED":
                elevated_count += 1
            else:
                critical_count += 1

        return {
            "total_sites": len(sites),
            "nominal_safety_count": nominal_count,
            "elevated_risk_count": elevated_count,
            "critical_hazard_count": critical_count,
            "hazard_distribution": [
                {"category": "Nominal / Low Hazard", "count": nominal_count, "color": "#10b981"},
                {"category": "Elevated / Moderate Hazard", "count": elevated_count, "color": "#f59e0b"},
                {"category": "Critical / High Hazard", "count": critical_count, "color": "#ef4444"}
            ]
        }
