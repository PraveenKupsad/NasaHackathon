export interface SiteProvenance {
  topography: string;
  illumination: string;
  micro_relief: string;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  code: string;
  lat: number;
  lon: number;
  elevation_m: number;
  slope_mean_deg: number;
  slope_max_deg: number;
  surface_roughness_m: number;
  illumination_annual_pct: number;
  illumination_summer_pct: number;
  earth_los_pct: number;
  crater_proximity_km: number;
  nearest_crater: string;
  hazard_density: number;
  landing_clearance_m: number;
  data_confidence_pct: number;
  provenance: SiteProvenance;
  description: string;
}

export interface FactorScores {
  slope_score: number;
  terrain_safety_score: number;
  illumination_score: number;
  crater_avoidance_score: number;
  accessibility_score: number;
}

export interface ExclusionResult {
  is_excluded: boolean;
  reasons: string[];
  slope_exceeded: boolean;
  hazard_exceeded: boolean;
  clearance_insufficient: boolean;
  illumination_insufficient: boolean;
  earth_los_lost: boolean;
  data_confidence_low: boolean;
}

export interface EvaluationResult {
  site: Site;
  factor_scores: FactorScores;
  weighted_score: number;
  final_score: number;
  exclusion: ExclusionResult;
  risk_classification: 'NOMINAL' | 'CAUTION' | 'HIGH_RISK' | 'UNACCEPTABLE';
  recommendation: string;
  recommendation_summary: string;
  confidence_level: 'HIGH' | 'MODERATE' | 'PROVISIONAL';
  provenance_status: string;
}

export interface Crater {
  id: string;
  name: string;
  lat: number;
  lon: number;
  diameter_km: number;
  depth_km: number;
  psr: boolean;
  psr_area_km2: number;
  rim_elevation_m: number;
  origin: string;
  features: string;
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  data_type: string;
  crs: string;
  resolution: string;
  acquisition_info: string;
  status: 'REAL' | 'SIMULATED';
  url: string;
  citation: string;
  notes: string;
}

export interface ElevationPoint {
  distance_km: number;
  elevation_m: number;
  slope_local_deg: number;
  datum: string;
  provenance: string;
}

export interface SlopeBin {
  range: string;
  percentage: number;
  description: string;
  provenance: string;
}

export interface SolarTimelinePoint {
  day_of_year: number;
  illumination_pct: number;
  solar_elevation_deg: number;
  solar_flux_w_m2: number;
  estimated_power_kw: number;
  status: 'ILLUMINATED' | 'SHADOWED';
  provenance: string;
}

export interface SolarSummary {
  annual_illumination_fraction: number;
  summer_solstice_peak_fraction: number;
  is_permanent_shadow_region: boolean;
  longest_consecutive_shadow_hours: number;
  required_energy_storage_kwh: number;
  estimated_battery_mass_kg: number;
  solar_feasibility_verdict: string;
  thermal_environment: string;
  provenance: string;
}

export interface HazardBreakdown {
  composite_hazard_index: number;
  overall_hazard_level: 'CRITICAL' | 'ELEVATED' | 'NOMINAL';
  slope_stability_risk: string;
  boulder_impact_risk: string;
  rim_proximity_risk: string;
  surface_roughness_rms_m: number;
  hazard_density_normalized: number;
  tipping_angle_margin_deg: number;
  provenance: string;
}

export interface ClearanceEnvelope {
  required_radius_m: number;
  available_clearance_m: number;
  margin_m: number;
  clearance_ratio: number;
  clearance_status: 'CLEAR' | 'MARGINAL' | 'INSUFFICIENT';
  boulder_count_est_over_1m: number;
  steepest_local_scarp_deg: number;
  provenance: string;
}

export interface SiteDetail {
  site: Site;
  evaluation: EvaluationResult;
  elevation_profile: ElevationPoint[];
  slope_distribution: SlopeBin[];
  clearance_envelope: ClearanceEnvelope;
  solar_timeline: SolarTimelinePoint[];
  solar_summary: SolarSummary;
  hazard_breakdown: HazardBreakdown;
}

export interface MissionOverviewData {
  mission_objective: string;
  candidate_sites_total: number;
  candidate_sites_passing: number;
  candidate_sites_excluded: number;
  highest_scoring_candidate: {
    id: string;
    name: string;
    score: number;
    region: string;
    risk: string;
    lat: number;
    lon: number;
  } | null;
  overall_hazard_summary: {
    total_sites: number;
    nominal_safety_count: number;
    elevated_risk_count: number;
    critical_hazard_count: number;
    hazard_distribution: Array<{ category: string; count: number; color: string }>;
  };
  illumination_stats: {
    mean_annual_illumination_pct: number;
    permanently_shadowed_sites_count: number;
    high_illumination_sites_count: number;
  };
  terrain_stats: {
    mean_slope_deg: number;
    mean_elevation_m: number;
    lowest_elevation_m: number;
    highest_elevation_m: number;
  };
  datasets_available_count: number;
  craters_mapped_count: number;
  analysis_completion_status: string;
  recent_activity: Array<{ time: string; event: string; status: string }>;
}

export interface ComparisonResponse {
  sites: EvaluationResult[];
  recommended_site_id: string | null;
  recommendation_rationale: string;
  tradeoff_matrix: Record<string, {
    strengths: string[];
    weaknesses: string[];
    radar_factors: Array<{ factor: string; score: number }>;
  }>;
}

export interface MissionConfig {
  id: string;
  name: string;
  mission_identifier: string;
  footprint_diameter_m: number;
  max_acceptable_slope: number;
  min_illumination_req: number;
  max_hazard_tolerance: number;
  mission_duration_days: number;
  require_earth_los: boolean;
  weights: Record<string, number>;
  created_at?: string;
}
