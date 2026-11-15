from typing import Dict, Any, List, Tuple
from app.models.site import Site, FactorScores, ExclusionResult, EvaluationResult
from app.config import ScoringWeights, HardConstraints

class ScoringEngine:
    """
    Explainable scientific scoring engine for Lunar South Pole landing site suitability.
    Computes individual factor metrics (0-100), applies user-configurable weighting,
    and enforces rigorous independent hard safety exclusion constraints.
    """

    @staticmethod
    def validate_weights(weights: Dict[str, float]) -> Tuple[bool, str, Dict[str, float]]:
        required = ["slope", "terrain", "illumination", "crater_avoidance", "accessibility"]
        clean_weights = {}
        for k in required:
            val = weights.get(k, 0.0)
            if val < 0.0:
                return False, f"Weight '{k}' cannot be negative", {}
            clean_weights[k] = float(val)
            
        total = sum(clean_weights.values())
        if abs(total - 1.0) > 1e-3:
            # If sums to 100, normalize
            if abs(total - 100.0) < 1.0:
                clean_weights = {k: v / 100.0 for k, v in clean_weights.items()}
            elif total > 0:
                # Normalize automatically
                clean_weights = {k: v / total for k, v in clean_weights.items()}
            else:
                return False, "Total weight must be positive and sum to 1.0 (or 100%)", {}

        return True, "Weights valid", clean_weights

    @classmethod
    def calculate_factor_scores(cls, site: Site, max_slope_limit: float = 10.0) -> FactorScores:
        # 1. Slope Score (0-100)
        # Optimal slopes are 0° to 3°. Penalties scale smoothly up to max_slope_limit.
        if site.slope_mean_deg <= 2.0:
            slope_score = 98.0
        elif site.slope_mean_deg <= max_slope_limit:
            # Scale from 95 down to 30 at the threshold limit
            ratio = (site.slope_mean_deg - 2.0) / max(1.0, (max_slope_limit - 2.0))
            slope_score = 95.0 - (ratio * 65.0)
        else:
            # Steep slope decay
            excess = site.slope_mean_deg - max_slope_limit
            slope_score = max(0.0, 30.0 - (excess * 8.0))
            
        # Additional penalty if maximum localized slope spikes dangerously
        if site.slope_max_deg > max_slope_limit * 1.4:
            slope_score = max(0.0, slope_score - 15.0)

        # 2. Terrain Safety Score (0-100)
        # Considers surface roughness and hazard density (boulders/scarps)
        # Roughness: <0.3m is excellent, >1.5m is rough
        roughness_factor = max(0.0, min(1.0, 1.0 - (site.surface_roughness_m / 1.8)))
        hazard_factor = max(0.0, min(1.0, 1.0 - site.hazard_density))
        terrain_score = (roughness_factor * 0.4 + hazard_factor * 0.6) * 100.0

        # 3. Illumination Score (0-100)
        # Blend of annual solar fraction (70%) and summer solstice peak (30%)
        illum_score = (site.illumination_annual_pct * 0.7) + (site.illumination_summer_pct * 0.3)
        illum_score = max(0.0, min(100.0, illum_score))

        # 4. Crater Avoidance Score (0-100)
        # Craters introduce sharp slope gradients, shadowed walls, and unstable regolith
        # Distance >= 5 km is safe (100). Distance < 0.5 km is very risky (<20).
        if site.crater_proximity_km >= 6.0:
            crater_score = 98.0
        elif site.crater_proximity_km >= 1.0:
            crater_score = 40.0 + ((site.crater_proximity_km - 1.0) / 5.0) * 55.0
        else:
            crater_score = max(5.0, (site.crater_proximity_km / 1.0) * 40.0)

        # 5. Accessibility & Operations Score (0-100)
        # Landing clearance margin and direct-to-Earth communication availability
        clearance_factor = min(1.0, site.landing_clearance_m / 120.0)
        los_factor = site.earth_los_pct / 100.0
        accessibility_score = (clearance_factor * 0.4 + los_factor * 0.6) * 100.0

        return FactorScores(
            slope_score=round(max(0.0, min(100.0, slope_score)), 1),
            terrain_safety_score=round(max(0.0, min(100.0, terrain_score)), 1),
            illumination_score=round(max(0.0, min(100.0, illum_score)), 1),
            crater_avoidance_score=round(max(0.0, min(100.0, crater_score)), 1),
            accessibility_score=round(max(0.0, min(100.0, accessibility_score)), 1)
        )

    @classmethod
    def evaluate_hard_exclusions(
        cls,
        site: Site,
        max_slope_deg: float = 10.0,
        min_illumination_pct: float = 20.0,
        max_hazard_tolerance: float = 0.50,
        landing_footprint_m: float = 100.0,
        require_earth_los: bool = False
    ) -> ExclusionResult:
        """
        Enforce strict aerospace safety boundaries.
        A candidate violating ANY hard constraint is flagged as EXCLUDED,
        preventing recommendation regardless of weighted score.
        """
        reasons = []
        slope_exceeded = False
        hazard_exceeded = False
        clearance_insufficient = False
        illumination_insufficient = False
        earth_los_lost = False
        data_confidence_low = False

        # 1. Slope Constraint
        if site.slope_mean_deg > max_slope_deg:
            reasons.append(f"Mean slope ({site.slope_mean_deg:.1f}°) exceeds mission safety threshold ({max_slope_deg:.1f}°)")
            slope_exceeded = True
        elif site.slope_max_deg > (max_slope_deg * 1.6):
            reasons.append(f"Peak localized slope ({site.slope_max_deg:.1f}°) exceeds critical landing gear tilt limit ({max_slope_deg * 1.6:.1f}°)")
            slope_exceeded = True

        # 2. Critical Hazard Inside Footprint
        if site.hazard_density > max_hazard_tolerance:
            reasons.append(f"Hazard density index ({site.hazard_density:.2f}) exceeds allowable tolerance ({max_hazard_tolerance:.2f})")
            hazard_exceeded = True

        # 3. Landing Clearance vs Footprint
        min_required_clearance = landing_footprint_m * 0.5
        if site.landing_clearance_m < min_required_clearance:
            reasons.append(f"Usable flat radius ({site.landing_clearance_m:.0f}m) is insufficient for target landing footprint ({landing_footprint_m:.0f}m diam, req: {min_required_clearance:.0f}m)")
            clearance_insufficient = True

        # 4. Illumination Requirements
        if site.illumination_annual_pct < min_illumination_pct:
            reasons.append(f"Annual illumination ({site.illumination_annual_pct:.1f}%) fails minimum solar architecture requirement ({min_illumination_pct:.1f}%)")
            illumination_insufficient = True

        # 5. Direct-to-Earth Line of Sight
        if require_earth_los and site.earth_los_pct < 15.0:
            reasons.append(f"Earth direct visibility ({site.earth_los_pct:.1f}%) fails mandatory continuous communication constraint")
            earth_los_lost = True

        # 6. Data Confidence
        if site.data_confidence_pct < 50.0:
            reasons.append(f"Terrain data confidence ({site.data_confidence_pct:.1f}%) is below operational mission certification standard (50.0%)")
            data_confidence_low = True

        is_excluded = len(reasons) > 0

        return ExclusionResult(
            is_excluded=is_excluded,
            reasons=reasons,
            slope_exceeded=slope_exceeded,
            hazard_exceeded=hazard_exceeded,
            clearance_insufficient=clearance_insufficient,
            illumination_insufficient=illumination_insufficient,
            earth_los_lost=earth_los_lost,
            data_confidence_low=data_confidence_low
        )

    @classmethod
    def evaluate_site(
        cls,
        site: Site,
        weights: Dict[str, float],
        max_slope_deg: float = 10.0,
        min_illumination_pct: float = 20.0,
        max_hazard_tolerance: float = 0.50,
        landing_footprint_m: float = 100.0,
        require_earth_los: bool = False
    ) -> EvaluationResult:
        # Validate or default weights
        valid, _, normalized_weights = cls.validate_weights(weights)
        if not valid:
            normalized_weights = {
                "slope": 0.30,
                "terrain": 0.25,
                "illumination": 0.20,
                "crater_avoidance": 0.15,
                "accessibility": 0.10
            }

        # Calculate factor scores (0-100)
        factors = cls.calculate_factor_scores(site, max_slope_limit=max_slope_deg)

        # Weighted calculation
        weighted_score = (
            factors.slope_score * normalized_weights["slope"] +
            factors.terrain_safety_score * normalized_weights["terrain"] +
            factors.illumination_score * normalized_weights["illumination"] +
            factors.crater_avoidance_score * normalized_weights["crater_avoidance"] +
            factors.accessibility_score * normalized_weights["accessibility"]
        )
        weighted_score = round(weighted_score, 1)

        # Evaluate hard exclusions independently
        exclusion = cls.evaluate_hard_exclusions(
            site=site,
            max_slope_deg=max_slope_deg,
            min_illumination_pct=min_illumination_pct,
            max_hazard_tolerance=max_hazard_tolerance,
            landing_footprint_m=landing_footprint_m,
            require_earth_los=require_earth_los
        )

        # Determine final operational score and risk classification
        if exclusion.is_excluded:
            # Excluded sites suffer hard disqualification
            final_score = min(weighted_score, 35.0)
            risk_classification = "UNACCEPTABLE"
            recommendation = "DISQUALIFIED (SAFETY EXCLUSION)"
            recommendation_summary = (
                f"Candidate {site.name} violates mandatory constraints: " +
                "; ".join(exclusion.reasons) +
                ". High weighted mathematical score cannot override physical landing safety violations."
            )
        else:
            final_score = weighted_score
            if final_score >= 80.0:
                risk_classification = "NOMINAL"
                recommendation = "PRIME CANDIDATE"
                recommendation_summary = (
                    f"Candidate {site.name} meets all mission constraints with favorable slope ({site.slope_mean_deg}°), "
                    f"superior illumination ({site.illumination_annual_pct}%), and sufficient footprint margin ({site.landing_clearance_m}m)."
                )
            elif final_score >= 65.0:
                risk_classification = "CAUTION"
                recommendation = "SECONDARY CANDIDATE"
                recommendation_summary = (
                    f"Candidate {site.name} passes hard criteria but exhibits moderate trade-offs in "
                    f"{'illumination' if factors.illumination_score < 70 else 'crater proximity'}. Requires localized terrain hazard mapping."
                )
            else:
                risk_classification = "HIGH_RISK"
                recommendation = "CONTINGENCY ONLY"
                recommendation_summary = (
                    f"Candidate {site.name} has marginal operational parameters. Significant hazard or access constraints require active mitigation."
                )

        confidence_level = (
            "HIGH" if site.data_confidence_pct >= 90.0
            else "MODERATE" if site.data_confidence_pct >= 75.0
            else "PROVISIONAL"
        )

        provenance_status = "MIXED (LOLA/LROC + SIMULATED ROUGHNESS)"

        return EvaluationResult(
            site=site,
            factor_scores=factors,
            weighted_score=weighted_score,
            final_score=round(final_score, 1),
            exclusion=exclusion,
            risk_classification=risk_classification,
            recommendation=recommendation,
            recommendation_summary=recommendation_summary,
            confidence_level=confidence_level,
            provenance_status=provenance_status
        )
