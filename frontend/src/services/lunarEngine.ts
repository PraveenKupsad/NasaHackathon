import {
  Site,
  FactorScores,
  ExclusionResult,
  EvaluationResult,
  Crater,
  Dataset,
  ElevationPoint,
  SlopeBin,
  ClearanceEnvelope,
  SolarTimelinePoint,
  SolarSummary,
  HazardBreakdown,
  SiteDetail,
  MissionOverviewData,
  ComparisonResponse,
  MissionConfig
} from '../types';

import rawDemoSites from '../data/demo_sites.json';
import rawCraters from '../data/craters.json';
import rawDatasets from '../data/datasets.json';

export const DEMO_SITES: Site[] = rawDemoSites as Site[];
export const CRATERS: Crater[] = rawCraters as Crater[];
export const DATASETS: Dataset[] = rawDatasets as Dataset[];

// Seeded pseudorandom generator for deterministic calculations
function createSeededRandom(seed: number) {
  let s = Math.abs(Math.floor(seed)) % 2147483647;
  if (s === 0) s = 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function normalRandom(rng: () => number, mean: number, stdDev: number) {
  const u1 = Math.max(1e-7, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export class LunarEngine {
  static validateWeights(weights?: Record<string, number>): Record<string, number> {
    const required = ['slope', 'terrain', 'illumination', 'crater_avoidance', 'accessibility'];
    const clean: Record<string, number> = {};
    for (const k of required) {
      const val = weights ? weights[k] : undefined;
      clean[k] = typeof val === 'number' && !isNaN(val) ? Math.max(0, val) : 0;
    }
    const total = Object.values(clean).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1.0) > 1e-3) {
      if (Math.abs(total - 100.0) < 1.0) {
        for (const k of required) clean[k] = clean[k] / 100.0;
      } else if (total > 0) {
        for (const k of required) clean[k] = clean[k] / total;
      } else {
        return {
          slope: 0.3,
          terrain: 0.25,
          illumination: 0.2,
          crater_avoidance: 0.15,
          accessibility: 0.1
        };
      }
    }
    return clean;
  }

  static calculateFactorScores(site: Site, maxSlopeLimit: number = 10.0): FactorScores {
    // 1. Slope Score (0-100)
    let slopeScore: number;
    if (site.slope_mean_deg <= 2.0) {
      slopeScore = 98.0;
    } else if (site.slope_mean_deg <= maxSlopeLimit) {
      const ratio = (site.slope_mean_deg - 2.0) / Math.max(1.0, maxSlopeLimit - 2.0);
      slopeScore = 95.0 - ratio * 65.0;
    } else {
      const excess = site.slope_mean_deg - maxSlopeLimit;
      slopeScore = Math.max(0.0, 30.0 - excess * 8.0);
    }
    if (site.slope_max_deg > maxSlopeLimit * 1.4) {
      slopeScore = Math.max(0.0, slopeScore - 15.0);
    }

    // 2. Terrain Safety Score (0-100)
    const roughnessFactor = Math.max(0.0, Math.min(1.0, 1.0 - site.surface_roughness_m / 1.8));
    const hazardFactor = Math.max(0.0, Math.min(1.0, 1.0 - site.hazard_density));
    const terrainScore = (roughnessFactor * 0.4 + hazardFactor * 0.6) * 100.0;

    // 3. Illumination Score (0-100)
    let illumScore = site.illumination_annual_pct * 0.7 + site.illumination_summer_pct * 0.3;
    illumScore = Math.max(0.0, Math.min(100.0, illumScore));

    // 4. Crater Avoidance Score (0-100)
    let craterScore: number;
    if (site.crater_proximity_km >= 6.0) {
      craterScore = 98.0;
    } else if (site.crater_proximity_km >= 1.0) {
      craterScore = 40.0 + ((site.crater_proximity_km - 1.0) / 5.0) * 55.0;
    } else {
      craterScore = Math.max(5.0, (site.crater_proximity_km / 1.0) * 40.0);
    }

    // 5. Accessibility & Operations Score (0-100)
    const clearanceFactor = Math.min(1.0, site.landing_clearance_m / 120.0);
    const losFactor = site.earth_los_pct / 100.0;
    const accessibilityScore = (clearanceFactor * 0.4 + losFactor * 0.6) * 100.0;

    return {
      slope_score: Number(Math.max(0, Math.min(100, slopeScore)).toFixed(1)),
      terrain_safety_score: Number(Math.max(0, Math.min(100, terrainScore)).toFixed(1)),
      illumination_score: Number(Math.max(0, Math.min(100, illumScore)).toFixed(1)),
      crater_avoidance_score: Number(Math.max(0, Math.min(100, craterScore)).toFixed(1)),
      accessibility_score: Number(Math.max(0, Math.min(100, accessibilityScore)).toFixed(1))
    };
  }

  static evaluateHardExclusions(
    site: Site,
    maxSlopeDeg: number = 10.0,
    minIllumPct: number = 20.0,
    maxHazardTolerance: number = 0.5,
    landingFootprintM: number = 100.0,
    requireEarthLos: boolean = false
  ): ExclusionResult {
    const reasons: string[] = [];
    let slopeExceeded = false;
    let hazardExceeded = false;
    let clearanceInsufficient = false;
    let illuminationInsufficient = false;
    let earthLosLost = false;
    let dataConfidenceLow = false;

    // 1. Slope Constraint
    if (site.slope_mean_deg > maxSlopeDeg) {
      reasons.push(
        `Mean slope (${site.slope_mean_deg.toFixed(1)}°) exceeds mission safety threshold (${maxSlopeDeg.toFixed(1)}°)`
      );
      slopeExceeded = true;
    } else if (site.slope_max_deg > maxSlopeDeg * 1.6) {
      reasons.push(
        `Peak localized slope (${site.slope_max_deg.toFixed(1)}°) exceeds critical landing gear tilt limit (${(
          maxSlopeDeg * 1.6
        ).toFixed(1)}°)`
      );
      slopeExceeded = true;
    }

    // 2. Critical Hazard Inside Footprint
    if (site.hazard_density > maxHazardTolerance) {
      reasons.push(
        `Hazard density index (${site.hazard_density.toFixed(2)}) exceeds allowable tolerance (${maxHazardTolerance.toFixed(
          2
        )})`
      );
      hazardExceeded = true;
    }

    // 3. Landing Clearance vs Footprint
    const minRequiredClearance = landingFootprintM * 0.5;
    if (site.landing_clearance_m < minRequiredClearance) {
      reasons.push(
        `Usable flat radius (${site.landing_clearance_m.toFixed(
          0
        )}m) is insufficient for target landing footprint (${landingFootprintM.toFixed(
          0
        )}m diam, req: ${minRequiredClearance.toFixed(0)}m)`
      );
      clearanceInsufficient = true;
    }

    // 4. Illumination Requirements
    if (site.illumination_annual_pct < minIllumPct) {
      reasons.push(
        `Annual illumination (${site.illumination_annual_pct.toFixed(
          1
        )}%) fails minimum solar architecture requirement (${minIllumPct.toFixed(1)}%)`
      );
      illuminationInsufficient = true;
    }

    // 5. Direct-to-Earth Line of Sight
    if (requireEarthLos && site.earth_los_pct < 15.0) {
      reasons.push(
        `Earth direct visibility (${site.earth_los_pct.toFixed(1)}%) fails mandatory continuous communication constraint`
      );
      earthLosLost = true;
    }

    // 6. Data Confidence
    if (site.data_confidence_pct < 50.0) {
      reasons.push(
        `Terrain data confidence (${site.data_confidence_pct.toFixed(
          1
        )}%) is below operational mission certification standard (50.0%)`
      );
      dataConfidenceLow = true;
    }

    const isExcluded = reasons.length > 0;

    return {
      is_excluded: isExcluded,
      reasons,
      slope_exceeded: slopeExceeded,
      hazard_exceeded: hazardExceeded,
      clearance_insufficient: clearanceInsufficient,
      illumination_insufficient: illuminationInsufficient,
      earth_los_lost: earthLosLost,
      data_confidence_low: dataConfidenceLow
    };
  }

  static evaluateSite(
    site: Site,
    weights?: Record<string, number>,
    maxSlopeDeg: number = 10.0,
    minIllumPct: number = 20.0,
    maxHazardTolerance: number = 0.5,
    landingFootprintM: number = 100.0,
    requireEarthLos: boolean = false
  ): EvaluationResult {
    const normalizedWeights = this.validateWeights(weights);
    const factors = this.calculateFactorScores(site, maxSlopeDeg);

    const weightedScore = Number(
      (
        factors.slope_score * normalizedWeights.slope +
        factors.terrain_safety_score * normalizedWeights.terrain +
        factors.illumination_score * normalizedWeights.illumination +
        factors.crater_avoidance_score * normalizedWeights.crater_avoidance +
        factors.accessibility_score * normalizedWeights.accessibility
      ).toFixed(1)
    );

    const exclusion = this.evaluateHardExclusions(
      site,
      maxSlopeDeg,
      minIllumPct,
      maxHazardTolerance,
      landingFootprintM,
      requireEarthLos
    );

    let finalScore: number;
    let riskClassification: 'NOMINAL' | 'CAUTION' | 'HIGH_RISK' | 'UNACCEPTABLE';
    let recommendation: string;
    let recommendationSummary: string;

    if (exclusion.is_excluded) {
      finalScore = Math.min(weightedScore, 35.0);
      riskClassification = 'UNACCEPTABLE';
      recommendation = 'DISQUALIFIED (SAFETY EXCLUSION)';
      recommendationSummary =
        `Candidate ${site.name} violates mandatory constraints: ` +
        exclusion.reasons.join('; ') +
        '. High weighted mathematical score cannot override physical landing safety violations.';
    } else {
      finalScore = weightedScore;
      if (finalScore >= 80.0) {
        riskClassification = 'NOMINAL';
        recommendation = 'PRIME CANDIDATE';
        recommendationSummary =
          `Candidate ${site.name} meets all mission constraints with favorable slope (${site.slope_mean_deg}°), ` +
          `superior illumination (${site.illumination_annual_pct}%), and sufficient footprint margin (${site.landing_clearance_m}m).`;
      } else if (finalScore >= 65.0) {
        riskClassification = 'CAUTION';
        recommendation = 'SECONDARY CANDIDATE';
        recommendationSummary =
          `Candidate ${site.name} passes hard criteria but exhibits moderate trade-offs in ` +
          `${factors.illumination_score < 70 ? 'illumination' : 'crater proximity'}. Requires localized terrain hazard mapping.`;
      } else {
        riskClassification = 'HIGH_RISK';
        recommendation = 'CONTINGENCY ONLY';
        recommendationSummary =
          `Candidate ${site.name} has marginal operational parameters. Significant hazard or access constraints require active mitigation.`;
      }
    }

    const confidenceLevel =
      site.data_confidence_pct >= 90.0 ? 'HIGH' : site.data_confidence_pct >= 75.0 ? 'MODERATE' : 'PROVISIONAL';

    return {
      site,
      factor_scores: factors,
      weighted_score: weightedScore,
      final_score: Number(finalScore.toFixed(1)),
      exclusion,
      risk_classification: riskClassification,
      recommendation,
      recommendation_summary: recommendationSummary,
      confidence_level: confidenceLevel,
      provenance_status: 'MIXED (LOLA/LROC + SIMULATED ROUGHNESS)'
    };
  }

  static generateElevationProfile(site: Site, radiusKm: number = 5.0, numPoints: number = 21): ElevationPoint[] {
    const profile: ElevationPoint[] = [];
    const baseElev = site.elevation_m;
    const slopeRad = (site.slope_mean_deg * Math.PI) / 180.0;
    const step = (2 * radiusKm) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const d = -radiusKm + i * step;
      const elevTrend = baseElev + d * 1000.0 * Math.tan(slopeRad) * 0.4;

      const seed = Math.abs(Math.floor(site.lat * 1000 + site.lon * 100 + d * 10)) % 100000;
      const rng = createSeededRandom(seed);
      const microNoise = normalRandom(rng, 0, site.surface_roughness_m * 1.5);

      const distToCenter = Math.abs(d - site.crater_proximity_km);
      let craterDrop = 0.0;
      if (distToCenter < 1.0) {
        craterDrop = -120.0 * (1.0 - distToCenter);
      }

      const totalElev = elevTrend + microNoise + craterDrop;

      profile.push({
        distance_km: Number(d.toFixed(2)),
        elevation_m: Number(totalElev.toFixed(1)),
        slope_local_deg: Number(Math.abs(site.slope_mean_deg + normalRandom(rng, 0, 1.2)).toFixed(1)),
        datum: 'LOLA Polar Topography (1737.4 km reference sphere)',
        provenance: 'REAL LOLA macro + SIMULATED sub-pixel micro-relief'
      });
    }

    return profile;
  }

  static generateSlopeDistribution(site: Site): SlopeBin[] {
    const bins = [
      { range: '0° - 3°', description: 'Optimal (Safe for all landers)' },
      { range: '3° - 6°', description: 'Nominal (Within landing envelope)' },
      { range: '6° - 10°', description: 'Caution (Lander leg stroking risk)' },
      { range: '10° - 15°', description: 'Hazard (Dynamic tipping risk)' },
      { range: '> 15°', description: 'Critical (Prohibited slope)' }
    ];

    const mean = site.slope_mean_deg;
    let pcts: number[];
    if (mean < 4.0) {
      pcts = [52.0, 36.0, 9.5, 2.0, 0.5];
    } else if (mean < 6.0) {
      pcts = [24.0, 48.0, 21.0, 5.5, 1.5];
    } else if (mean < 8.0) {
      pcts = [12.0, 32.0, 38.0, 14.0, 4.0];
    } else if (mean < 12.0) {
      pcts = [4.0, 16.0, 42.0, 26.0, 12.0];
    } else {
      pcts = [1.0, 3.0, 12.0, 36.0, 48.0];
    }

    return bins.map((b, i) => ({
      range: b.range,
      percentage: pcts[i],
      description: b.description,
      provenance: 'SIMULATED (Weibull regolith distribution conditioned on LOLA mean slope)'
    }));
  }

  static evaluateClearanceEnvelope(site: Site, footprintDiamM: number = 100.0): ClearanceEnvelope {
    const requiredRadius = footprintDiamM / 2.0;
    const marginM = site.landing_clearance_m - requiredRadius;
    const clearanceRatio = site.landing_clearance_m / Math.max(1.0, requiredRadius);

    const status: 'CLEAR' | 'MARGINAL' | 'INSUFFICIENT' =
      marginM >= 20.0 ? 'CLEAR' : marginM >= 0.0 ? 'MARGINAL' : 'INSUFFICIENT';

    return {
      required_radius_m: requiredRadius,
      available_clearance_m: site.landing_clearance_m,
      margin_m: Number(marginM.toFixed(1)),
      clearance_ratio: Number(clearanceRatio.toFixed(2)),
      clearance_status: status,
      boulder_count_est_over_1m: Math.floor(site.hazard_density * 45),
      steepest_local_scarp_deg: site.slope_max_deg,
      provenance: 'SIMULATED (Apollo boulder SFD model scaled by LOLA roughness)'
    };
  }

  static generateAnnualTimeline(site: Site, numSamples: number = 24): SolarTimelinePoint[] {
    const timeline: SolarTimelinePoint[] = [];
    const degFromPole = 90.0 - Math.abs(site.lat);
    const elevKm = site.elevation_m / 1000.0;
    const step = 365 / (numSamples - 1);

    for (let i = 0; i < numSamples; i++) {
      const d = i * step;
      const solarSubLat = -1.54 * Math.cos((2 * Math.PI * d) / 365.25);
      const baseSolarElev = solarSubLat + degFromPole * 0.4 + elevKm * 0.03;

      let isIlluminated = false;
      let illumPct = 0.0;
      let solarFluxWM2 = 0.0;
      let powerKw = 0.0;

      if (site.illumination_annual_pct >= 1.0) {
        const seasonalFactor =
          (site.illumination_summer_pct - site.illumination_annual_pct) * Math.sin((Math.PI * d) / 365.25);
        let localIllum = site.illumination_annual_pct + seasonalFactor;
        localIllum = Math.max(0.0, Math.min(100.0, localIllum));
        isIlluminated = localIllum > 30.0;
        illumPct = Number(localIllum.toFixed(1));

        const grazeSin = Math.max(
          0.02,
          Math.min(0.12, Math.sin(((Math.max(0.5, baseSolarElev + 2.0) * Math.PI) / 180.0)))
        );
        solarFluxWM2 = Number((1361.0 * (localIllum / 100.0) * grazeSin).toFixed(1));
        powerKw = Number(((solarFluxWM2 * 10.0 * 0.28) / 1000.0).toFixed(2));
      }

      timeline.push({
        day_of_year: Math.round(d),
        illumination_pct: illumPct,
        solar_elevation_deg: Number(baseSolarElev.toFixed(2)),
        solar_flux_w_m2: solarFluxWM2,
        estimated_power_kw: powerKw,
        status: isIlluminated ? 'ILLUMINATED' : 'SHADOWED',
        provenance: 'SIMULATED (Ephemeris orbital model constrained by LROC WAC empirical albedo)'
      });
    }

    return timeline;
  }

  static getSolarSummary(site: Site): SolarSummary {
    const isPsr = site.illumination_annual_pct < 5.0;
    let maxShadowHrs: number;
    let batteryMassReqKg: number;
    let batteryKwh: number;
    let solarPowerFeasibility: string;

    if (isPsr) {
      maxShadowHrs = 8760;
      batteryMassReqKg = 9999.0;
      batteryKwh = 999.0;
      solarPowerFeasibility = 'UNFEASIBLE (Requires Nuclear / RTG or Tethered Power)';
    } else {
      maxShadowHrs = Number(((100.0 - site.illumination_summer_pct) * 2.8).toFixed(1));
      batteryKwh = Number(((maxShadowHrs * 0.5) / 0.85).toFixed(1));
      batteryMassReqKg = Number((batteryKwh * 6.5).toFixed(1));
      solarPowerFeasibility = site.illumination_annual_pct >= 80.0 ? 'EXCELLENT' : 'FEASIBLE WITH SIZING';
    }

    return {
      annual_illumination_fraction: site.illumination_annual_pct,
      summer_solstice_peak_fraction: site.illumination_summer_pct,
      is_permanent_shadow_region: isPsr,
      longest_consecutive_shadow_hours: maxShadowHrs,
      required_energy_storage_kwh: batteryKwh,
      estimated_battery_mass_kg: batteryMassReqKg,
      solar_feasibility_verdict: solarPowerFeasibility,
      thermal_environment: isPsr ? 'Extreme Cryogenic (< 90K)' : 'Cyclic (100K - 220K)',
      provenance: 'REAL LROC WAC multi-temporal statistics + SIMULATED battery trade model'
    };
  }

  static getHazardBreakdown(site: Site): HazardBreakdown {
    const slopeRisk = site.slope_mean_deg > 8.0 ? 'HIGH' : site.slope_mean_deg > 5.0 ? 'MODERATE' : 'LOW';
    const boulderRisk = site.hazard_density > 0.4 ? 'HIGH' : site.hazard_density > 0.2 ? 'MODERATE' : 'LOW';
    const craterRisk = site.crater_proximity_km < 1.0 ? 'CRITICAL' : site.crater_proximity_km < 3.0 ? 'MODERATE' : 'MINIMAL';

    const compositeHazardIndex = Number(
      (
        Math.min(1.0, site.slope_mean_deg / 15.0) * 0.4 +
        site.hazard_density * 0.35 +
        Math.max(0.0, 1.0 - site.crater_proximity_km / 5.0) * 0.25
      ).toFixed(2)
    );

    const overallHazardLevel: 'CRITICAL' | 'ELEVATED' | 'NOMINAL' =
      compositeHazardIndex > 0.6 ? 'CRITICAL' : compositeHazardIndex > 0.35 ? 'ELEVATED' : 'NOMINAL';

    return {
      composite_hazard_index: compositeHazardIndex,
      overall_hazard_level: overallHazardLevel,
      slope_stability_risk: slopeRisk,
      boulder_impact_risk: boulderRisk,
      rim_proximity_risk: craterRisk,
      surface_roughness_rms_m: site.surface_roughness_m,
      hazard_density_normalized: site.hazard_density,
      tipping_angle_margin_deg: Number(Math.max(0.0, 15.0 - site.slope_max_deg).toFixed(1)),
      provenance: 'REAL LOLA slopes + SIMULATED stochastic boulder hazard field'
    };
  }

  static getSiteDetail(siteId: string): SiteDetail {
    const site = DEMO_SITES.find((s) => s.id === siteId) || DEMO_SITES[0];
    const evaluation = this.evaluateSite(site);
    const elevationProfile = this.generateElevationProfile(site);
    const slopeDistribution = this.generateSlopeDistribution(site);
    const clearanceEnvelope = this.evaluateClearanceEnvelope(site);
    const solarTimeline = this.generateAnnualTimeline(site);
    const solarSummary = this.getSolarSummary(site);
    const hazardBreakdown = this.getHazardBreakdown(site);

    return {
      site,
      evaluation,
      elevation_profile: elevationProfile,
      slope_distribution: slopeDistribution,
      clearance_envelope: clearanceEnvelope,
      solar_timeline: solarTimeline,
      solar_summary: solarSummary,
      hazard_breakdown: hazardBreakdown
    };
  }

  static getSites(params?: {
    max_slope?: number;
    min_illum?: number;
    max_hazard?: number;
    footprint?: number;
  }): EvaluationResult[] {
    const maxSlope = params?.max_slope ?? 10.0;
    const minIllum = params?.min_illum ?? 20.0;
    const maxHazard = params?.max_hazard ?? 0.5;
    const footprint = params?.footprint ?? 100.0;

    const list = DEMO_SITES.map((s) =>
      this.evaluateSite(s, undefined, maxSlope, minIllum, maxHazard, footprint)
    );
    list.sort((a, b) => b.final_score - a.final_score);
    return list;
  }

  static analyzeSites(payload: {
    site_ids?: string[];
    weights?: Record<string, number>;
    max_slope_deg?: number;
    min_illumination_pct?: number;
    max_hazard_tolerance?: number;
    landing_footprint_m?: number;
    require_earth_los?: boolean;
  }): EvaluationResult[] {
    const targets =
      payload.site_ids && payload.site_ids.length > 0
        ? DEMO_SITES.filter((s) => payload.site_ids!.includes(s.id))
        : DEMO_SITES;

    const results = targets.map((s) =>
      this.evaluateSite(
        s,
        payload.weights,
        payload.max_slope_deg ?? 10.0,
        payload.min_illumination_pct ?? 20.0,
        payload.max_hazard_tolerance ?? 0.5,
        payload.landing_footprint_m ?? 100.0,
        payload.require_earth_los ?? false
      )
    );
    results.sort((a, b) => b.final_score - a.final_score);
    return results;
  }

  static compareSites(payload: {
    site_ids: string[];
    weights?: Record<string, number>;
    max_slope_deg?: number;
    min_illumination_pct?: number;
    max_hazard_tolerance?: number;
    landing_footprint_m?: number;
  }): ComparisonResponse {
    const selected = DEMO_SITES.filter((s) => payload.site_ids.includes(s.id));
    const evaluations = selected.map((s) =>
      this.evaluateSite(
        s,
        payload.weights,
        payload.max_slope_deg ?? 10.0,
        payload.min_illumination_pct ?? 20.0,
        payload.max_hazard_tolerance ?? 0.5,
        payload.landing_footprint_m ?? 100.0
      )
    );

    const nonExcluded = evaluations.filter((e) => !e.exclusion.is_excluded);
    let recommendedSiteId: string | null = null;
    let rationale: string;

    if (nonExcluded.length > 0) {
      const top = [...nonExcluded].sort((a, b) => b.final_score - a.final_score)[0];
      recommendedSiteId = top.site.id;
      rationale =
        `Candidate '${top.site.name}' (${top.site.code}) is recommended as the prime landing target with an operational score of ${top.final_score}/100. ` +
        `It strictly satisfies all mandatory engineering constraints (Slope: ${top.site.slope_mean_deg}°, Clearance: ${top.site.landing_clearance_m}m) ` +
        `while providing superior combined illumination (${top.site.illumination_annual_pct}%) and direct Earth visibility (${top.site.earth_los_pct}%).`;
    } else {
      rationale =
        'CRITICAL WARNING: None of the selected candidates pass mandatory safety exclusion criteria. ' +
        'No recommendation can be made among these targets due to active safety violations.';
    }

    const tradeoffMatrix: ComparisonResponse['tradeoff_matrix'] = {};
    for (const ev of evaluations) {
      const s = ev.site;
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      if (s.slope_mean_deg <= 4.0) strengths.push(`Very gentle landing slopes (${s.slope_mean_deg}°)`);
      if (s.illumination_annual_pct >= 80.0) strengths.push(`High annual solar exposure (${s.illumination_annual_pct}%)`);
      if (s.earth_los_pct >= 80.0) strengths.push(`Strong direct Earth radio visibility (${s.earth_los_pct}%)`);
      if (s.landing_clearance_m >= 100.0) strengths.push(`Generous flat clearance ellipse (${s.landing_clearance_m}m)`);

      if (s.slope_mean_deg > 8.0) weaknesses.push(`High average slope gradient (${s.slope_mean_deg}°)`);
      if (s.hazard_density > 0.35) weaknesses.push(`Elevated boulder hazard density (${s.hazard_density})`);
      if (s.illumination_annual_pct < 40.0) weaknesses.push(`Critical lack of solar energy (${s.illumination_annual_pct}%)`);
      if (s.crater_proximity_km < 1.5) weaknesses.push(`Hazardous rim scarp proximity (${s.crater_proximity_km} km)`);
      if (ev.exclusion.is_excluded) weaknesses.push(`DISQUALIFIED: ${ev.exclusion.reasons[0]}`);

      if (strengths.length === 0) strengths.push('Provisional access conditions');
      if (weaknesses.length === 0) weaknesses.push('Nominal engineering margins with no major liabilities');

      tradeoffMatrix[s.id] = {
        strengths,
        weaknesses,
        radar_factors: [
          { factor: 'Slope Suitability', score: ev.factor_scores.slope_score },
          { factor: 'Terrain Safety', score: ev.factor_scores.terrain_safety_score },
          { factor: 'Illumination', score: ev.factor_scores.illumination_score },
          { factor: 'Crater Distance', score: ev.factor_scores.crater_avoidance_score },
          { factor: 'Comm LOS', score: ev.factor_scores.accessibility_score }
        ]
      };
    }

    return {
      sites: evaluations,
      recommended_site_id: recommendedSiteId,
      recommendation_rationale: rationale,
      tradeoff_matrix: tradeoffMatrix
    };
  }

  static getMissionOverview(): MissionOverviewData {
    const defaultWeights = {
      slope: 0.3,
      terrain: 0.25,
      illumination: 0.2,
      crater_avoidance: 0.15,
      accessibility: 0.1
    };
    const evals = DEMO_SITES.map((s) => this.evaluateSite(s, defaultWeights));
    evals.sort((a, b) => b.final_score - a.final_score);

    const passing = evals.filter((e) => !e.exclusion.is_excluded);
    const excluded = evals.filter((e) => e.exclusion.is_excluded);

    let primeCandidate = null;
    if (passing.length > 0) {
      primeCandidate = {
        id: passing[0].site.id,
        name: passing[0].site.name,
        score: passing[0].final_score,
        region: passing[0].site.region,
        risk: passing[0].risk_classification,
        lat: passing[0].site.lat,
        lon: passing[0].site.lon
      };
    }

    let nominal = 0;
    let elevated = 0;
    let critical = 0;
    for (const s of DEMO_SITES) {
      const hz = this.getHazardBreakdown(s);
      if (hz.overall_hazard_level === 'NOMINAL') nominal++;
      else if (hz.overall_hazard_level === 'ELEVATED') elevated++;
      else critical++;
    }

    const totalSites = DEMO_SITES.length;
    const meanIllum = DEMO_SITES.reduce((acc, s) => acc + s.illumination_annual_pct, 0) / totalSites;
    const psrCount = DEMO_SITES.filter((s) => s.illumination_annual_pct < 5.0).length;
    const highIllumCount = DEMO_SITES.filter((s) => s.illumination_annual_pct >= 75.0).length;

    const meanSlope = DEMO_SITES.reduce((acc, s) => acc + s.slope_mean_deg, 0) / totalSites;
    const meanElev = DEMO_SITES.reduce((acc, s) => acc + s.elevation_m, 0) / totalSites;
    const elevations = DEMO_SITES.map((s) => s.elevation_m);

    return {
      mission_objective: 'Evaluate Artemis South Pole (-80° to -90°S) candidates for safe touchdown and continuous power.',
      candidate_sites_total: totalSites,
      candidate_sites_passing: passing.length,
      candidate_sites_excluded: excluded.length,
      highest_scoring_candidate: primeCandidate,
      overall_hazard_summary: {
        total_sites: totalSites,
        nominal_safety_count: nominal,
        elevated_risk_count: elevated,
        critical_hazard_count: critical,
        hazard_distribution: [
          { category: 'Nominal / Low Hazard', count: nominal, color: '#10b981' },
          { category: 'Elevated / Moderate Hazard', count: elevated, color: '#f59e0b' },
          { category: 'Critical / High Hazard', count: critical, color: '#ef4444' }
        ]
      },
      illumination_stats: {
        mean_annual_illumination_pct: Number(meanIllum.toFixed(1)),
        permanently_shadowed_sites_count: psrCount,
        high_illumination_sites_count: highIllumCount
      },
      terrain_stats: {
        mean_slope_deg: Number(meanSlope.toFixed(1)),
        mean_elevation_m: Number(meanElev.toFixed(0)),
        lowest_elevation_m: Math.min(...elevations),
        highest_elevation_m: Math.max(...elevations)
      },
      datasets_available_count: DATASETS.length,
      craters_mapped_count: CRATERS.length,
      analysis_completion_status: '100% OPERATIONAL (Autonomous Geospatial Engine)',
      recent_activity: [
        { time: '18:45 UTC', event: 'Autonomous Lunar Engine Synchronized', status: 'SUCCESS' },
        { time: '18:30 UTC', event: 'LOLA GDR Topography Transects Validated', status: 'SUCCESS' },
        { time: '18:15 UTC', event: 'LROC WAC Illumination Meshes Loaded', status: 'SUCCESS' },
        { time: '17:50 UTC', event: 'Diviner Thermal Cold Trap Boundaries Ingested', status: 'SUCCESS' }
      ]
    };
  }

  static getReport(siteId: string): any {
    const site = DEMO_SITES.find((s) => s.id === siteId) || DEMO_SITES[0];
    const defaultWeights = {
      slope: 0.3,
      terrain: 0.25,
      illumination: 0.2,
      crater_avoidance: 0.15,
      accessibility: 0.1
    };
    const evaluation = this.evaluateSite(site, defaultWeights);
    const terrainClearance = this.evaluateClearanceEnvelope(site);
    const solarSummary = this.getSolarSummary(site);
    const hazardBreakdown = this.getHazardBreakdown(site);

    return {
      report_id: `REP-LUNA-${site.code}-2026`,
      generated_at_utc: new Date().toISOString(),
      mission_identifier: 'ARTEMIS-III-SPT',
      site_identifier: site.id,
      site_code: site.code,
      site_name: site.name,
      region: site.region,
      coordinates: {
        latitude: site.lat,
        longitude: site.lon,
        coordinate_reference_system: 'IAU Moon 2000 / Lunar Polar Stereographic (EPSG:75400)'
      },
      suitability_score: evaluation.final_score,
      weighted_raw_score: evaluation.weighted_score,
      risk_classification: evaluation.risk_classification,
      recommendation: evaluation.recommendation,
      recommendation_reasoning: evaluation.recommendation_summary,
      hard_constraint_results: {
        status: evaluation.exclusion.is_excluded ? 'EXCLUDED' : 'PASS',
        is_excluded: evaluation.exclusion.is_excluded,
        violations: evaluation.exclusion.reasons,
        slope_check: evaluation.exclusion.slope_exceeded ? 'FAIL' : 'PASS',
        hazard_check: evaluation.exclusion.hazard_exceeded ? 'FAIL' : 'PASS',
        clearance_check: evaluation.exclusion.clearance_insufficient ? 'FAIL' : 'PASS',
        illumination_check: evaluation.exclusion.illumination_insufficient ? 'FAIL' : 'PASS'
      },
      factor_breakdown: {
        slope_suitability_score: evaluation.factor_scores.slope_score,
        terrain_safety_score: evaluation.factor_scores.terrain_safety_score,
        illumination_score: evaluation.factor_scores.illumination_score,
        crater_avoidance_score: evaluation.factor_scores.crater_avoidance_score,
        accessibility_score: evaluation.factor_scores.accessibility_score
      },
      terrain_assessment: {
        elevation_m: site.elevation_m,
        slope_mean_deg: site.slope_mean_deg,
        slope_max_deg: site.slope_max_deg,
        surface_roughness_m: site.surface_roughness_m,
        landing_clearance_m: site.landing_clearance_m,
        clearance_envelope: terrainClearance
      },
      illumination_assessment: {
        annual_illumination_fraction: site.illumination_annual_pct,
        summer_solstice_peak_fraction: site.illumination_summer_pct,
        solar_summary: solarSummary
      },
      hazard_assessment: hazardBreakdown,
      data_confidence: {
        confidence_pct: site.data_confidence_pct,
        rating: evaluation.confidence_level,
        provenance_flags: site.provenance
      },
      dataset_references: DATASETS
    };
  }

  static getMissionConfigs(): MissionConfig[] {
    const saved = localStorage.getItem('luna_nav_mission_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall back to default
      }
    }
    const defaultConfig: MissionConfig = {
      id: 'cfg-artemis-default',
      name: 'Artemis Human Landing Baseline',
      mission_identifier: 'ARTEMIS-III-SPT',
      footprint_diameter_m: 100.0,
      max_acceptable_slope: 10.0,
      min_illumination_req: 20.0,
      max_hazard_tolerance: 0.5,
      mission_duration_days: 14,
      require_earth_los: false,
      weights: {
        slope: 0.3,
        terrain: 0.25,
        illumination: 0.2,
        crater_avoidance: 0.15,
        accessibility: 0.1
      },
      created_at: new Date().toISOString()
    };
    localStorage.setItem('luna_nav_mission_configs', JSON.stringify([defaultConfig]));
    return [defaultConfig];
  }

  static configureMission(payload: Partial<MissionConfig>): MissionConfig {
    const configs = this.getMissionConfigs();
    const newConfig: MissionConfig = {
      id: payload.id || `cfg-${Date.now()}`,
      name: payload.name || 'Custom Artemis Mission',
      mission_identifier: payload.mission_identifier || 'ARTEMIS-CUSTOM',
      footprint_diameter_m: payload.footprint_diameter_m ?? 100.0,
      max_acceptable_slope: payload.max_acceptable_slope ?? 10.0,
      min_illumination_req: payload.min_illumination_req ?? 20.0,
      max_hazard_tolerance: payload.max_hazard_tolerance ?? 0.5,
      mission_duration_days: payload.mission_duration_days ?? 14,
      require_earth_los: payload.require_earth_los ?? false,
      weights: this.validateWeights(payload.weights),
      created_at: new Date().toISOString()
    };
    const updated = [newConfig, ...configs.filter((c) => c.id !== newConfig.id)];
    localStorage.setItem('luna_nav_mission_configs', JSON.stringify(updated));
    return newConfig;
  }

  static generateCsvExportString(): string {
    const defaultWeights = {
      slope: 0.3,
      terrain: 0.25,
      illumination: 0.2,
      crater_avoidance: 0.15,
      accessibility: 0.1
    };

    const headers = [
      'Site ID',
      'Code',
      'Name',
      'Region',
      'Latitude (deg)',
      'Longitude (deg)',
      'Elevation (m)',
      'Mean Slope (deg)',
      'Max Slope (deg)',
      'Roughness (m)',
      'Annual Illum (%)',
      'Summer Illum (%)',
      'Earth LOS (%)',
      'Nearest Crater',
      'Crater Dist (km)',
      'Hazard Density',
      'Clearance (m)',
      'Data Confidence (%)',
      'Weighted Score',
      'Final Score',
      'Exclusion Status',
      'Exclusion Reasons',
      'Risk Class',
      'Recommendation'
    ];

    const rows = [headers.join(',')];

    for (const s of DEMO_SITES) {
      const ev = this.evaluateSite(s, defaultWeights);
      const row = [
        s.id,
        s.code,
        `"${s.name}"`,
        `"${s.region}"`,
        s.lat,
        s.lon,
        s.elevation_m,
        s.slope_mean_deg,
        s.slope_max_deg,
        s.surface_roughness_m,
        s.illumination_annual_pct,
        s.illumination_summer_pct,
        s.earth_los_pct,
        `"${s.nearest_crater}"`,
        s.crater_proximity_km,
        s.hazard_density,
        s.landing_clearance_m,
        s.data_confidence_pct,
        ev.weighted_score,
        ev.final_score,
        ev.exclusion.is_excluded ? 'EXCLUDED' : 'PASSED',
        `"${ev.exclusion.reasons.join('; ') || 'None'}"`,
        ev.risk_classification,
        `"${ev.recommendation}"`
      ];
      rows.push(row.join(','));
    }

    return rows.join('\r\n');
  }
}
