import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { EvaluationResult } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Sliders,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

export const LandingSiteEvaluationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightedSiteId = searchParams.get('site');

  const [weights, setWeights] = useState({
    slope: 0.30,
    terrain: 0.25,
    illumination: 0.20,
    crater_avoidance: 0.15,
    accessibility: 0.10,
  });

  const [hardConstraints, setHardConstraints] = useState({
    max_slope_deg: 10.0,
    min_illumination_pct: 20.0,
    max_hazard_tolerance: 0.50,
    landing_footprint_m: 100.0,
    require_earth_los: false,
  });

  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightsValid = Math.abs(totalWeight - 1.0) < 0.005;

  const runEvaluation = async () => {
    try {
      setLoading(true);
      const results = await apiService.analyzeSites({
        weights,
        max_slope_deg: hardConstraints.max_slope_deg,
        min_illumination_pct: hardConstraints.min_illumination_pct,
        max_hazard_tolerance: hardConstraints.max_hazard_tolerance,
        landing_footprint_m: hardConstraints.landing_footprint_m,
        require_earth_los: hardConstraints.require_earth_los,
      });
      setEvaluations(results);

      if (highlightedSiteId) {
        const found = results.find(e => e.site.id === highlightedSiteId);
        if (found) setSelectedEvaluation(found);
        else if (results.length > 0) setSelectedEvaluation(results[0]);
      } else if (results.length > 0) {
        setSelectedEvaluation(results[0]);
      }
    } catch (err) {
      console.error('Failed to run evaluation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, [hardConstraints]);

  const handleNormalizeWeights = () => {
    const sum = totalWeight || 1;
    setWeights({
      slope: Number((weights.slope / sum).toFixed(2)),
      terrain: Number((weights.terrain / sum).toFixed(2)),
      illumination: Number((weights.illumination / sum).toFixed(2)),
      crater_avoidance: Number((weights.crater_avoidance / sum).toFixed(2)),
      accessibility: Number((weights.accessibility / sum).toFixed(2)),
    });
  };

  const handleResetDefaults = () => {
    setWeights({
      slope: 0.30,
      terrain: 0.25,
      illumination: 0.20,
      crater_avoidance: 0.15,
      accessibility: 0.10,
    });
    setHardConstraints({
      max_slope_deg: 10.0,
      min_illumination_pct: 20.0,
      max_hazard_tolerance: 0.50,
      landing_footprint_m: 100.0,
      require_earth_los: false,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Title */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Landing Site Evaluation & Safety Constraint Engine
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            Explainable Multi-Criteria Decision Analysis with Independent Hard Boundary Safety Verification
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetDefaults}
            className="px-2.5 py-1 bg-space-800 hover:bg-space-750 text-space-300 border border-space-700 rounded text-xs transition"
          >
            Reset Defaults
          </button>
          <button
            onClick={runEvaluation}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow transition flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Scores</span>
          </button>
        </div>
      </div>

      {/* Configuration Panels: Weights & Hard Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configurable Weights */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="text-space-200 font-semibold flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>CONFIGURABLE FACTOR WEIGHTS (MUST SUM TO 100%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[11px] font-bold ${isWeightsValid ? 'text-emerald-400' : 'text-red-400'}`}>
                {(totalWeight * 100).toFixed(0)}%
              </span>
              {!isWeightsValid && (
                <button
                  onClick={handleNormalizeWeights}
                  className="px-1.5 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded text-[10px]"
                >
                  Normalize
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {[
              { key: 'slope', label: 'Slope Suitability', val: weights.slope },
              { key: 'terrain', label: 'Terrain Safety (Roughness & Boulders)', val: weights.terrain },
              { key: 'illumination', label: 'Illumination Suitability', val: weights.illumination },
              { key: 'crater_avoidance', label: 'Crater Avoidance', val: weights.crater_avoidance },
              { key: 'accessibility', label: 'Accessibility & Direct Earth Visibility', val: weights.accessibility },
            ].map((item) => (
              <div key={item.key} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-300">{item.label}</span>
                  <span className="text-cyan-300 font-bold font-telemetry">{(item.val * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.60"
                  step="0.05"
                  value={item.val}
                  onChange={(e) =>
                    setWeights(prev => ({ ...prev, [item.key]: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-space-800 rounded"
                />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-space-800 text-[10px] text-space-400">
            Formula: <code className="text-cyan-300 font-telemetry">Final = (Slope×w₁) + (Terrain×w₂) + (Illum×w₃) + (Crater×w₄) + (Access×w₅)</code>
          </div>
        </div>

        {/* Independent Hard Safety Constraints */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="text-space-200 font-semibold flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>MANDATORY HARD EXCLUSION SAFETY RULES</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">NON-NEGOTIABLE</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-space-300 text-[11px] block">Max Acceptable Mean Slope:</span>
                <span className="text-[9px] text-space-400">Lander gear tipping boundary</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="3.0"
                  max="25.0"
                  step="0.5"
                  value={hardConstraints.max_slope_deg}
                  onChange={(e) => setHardConstraints(prev => ({ ...prev, max_slope_deg: parseFloat(e.target.value) || 10 }))}
                  className="w-16 bg-space-800 border border-space-700 text-cyan-300 px-1.5 py-0.5 rounded text-right font-telemetry"
                />
                <span className="text-space-400 text-xs">deg</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-space-300 text-[11px] block">Min Illumination Required:</span>
                <span className="text-[9px] text-space-400">Solar power viability cutoff</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0.0"
                  max="80.0"
                  step="5.0"
                  value={hardConstraints.min_illumination_pct}
                  onChange={(e) => setHardConstraints(prev => ({ ...prev, min_illumination_pct: parseFloat(e.target.value) || 0 }))}
                  className="w-16 bg-space-800 border border-space-700 text-cyan-300 px-1.5 py-0.5 rounded text-right font-telemetry"
                />
                <span className="text-space-400 text-xs">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-space-300 text-[11px] block">Max Hazard Density Tolerance:</span>
                <span className="text-[9px] text-space-400">Meter-scale boulder concentration</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0.10"
                  max="1.00"
                  step="0.05"
                  value={hardConstraints.max_hazard_tolerance}
                  onChange={(e) => setHardConstraints(prev => ({ ...prev, max_hazard_tolerance: parseFloat(e.target.value) || 0.5 }))}
                  className="w-16 bg-space-800 border border-space-700 text-cyan-300 px-1.5 py-0.5 rounded text-right font-telemetry"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-space-300 text-[11px] block">Target Landing Footprint:</span>
                <span className="text-[9px] text-space-400">Clear flat radius required</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="30.0"
                  max="300.0"
                  step="10.0"
                  value={hardConstraints.landing_footprint_m}
                  onChange={(e) => setHardConstraints(prev => ({ ...prev, landing_footprint_m: parseFloat(e.target.value) || 100 }))}
                  className="w-16 bg-space-800 border border-space-700 text-cyan-300 px-1.5 py-0.5 rounded text-right font-telemetry"
                />
                <span className="text-space-400 text-xs">m</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-space-300 text-[11px] block">Require Continuous Earth LOS:</span>
                <span className="text-[9px] text-space-400">Direct-to-Earth communication requirement</span>
              </div>
              <input
                type="checkbox"
                checked={hardConstraints.require_earth_los}
                onChange={(e) => setHardConstraints(prev => ({ ...prev, require_earth_los: e.target.checked }))}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-space-950 p-2 rounded border border-space-800 text-[10px] text-red-400/90 leading-tight">
            <strong>CRITICAL PRINCIPLE:</strong> Any candidate violating a hard constraint is immediately DISQUALIFIED. High weighted mathematical scores CANNOT override physical safety limits.
          </div>
        </div>
      </div>

      {/* Selected Candidate Detailed Evaluation Card */}
      {selectedEvaluation && (
        <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-space-800 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white uppercase">{selectedEvaluation.site.name}</h2>
                <span className="text-[10px] text-space-400">({selectedEvaluation.site.code})</span>
                {selectedEvaluation.exclusion.is_excluded ? (
                  <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[10px] font-bold">
                    DISQUALIFIED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                    RECOMMENDED CANDIDATE
                  </span>
                )}
              </div>
              <div className="text-[10px] text-space-400 mt-0.5">
                {selectedEvaluation.site.lat.toFixed(2)}° S, {selectedEvaluation.site.lon.toFixed(2)}° E • Elevation: {selectedEvaluation.site.elevation_m}m
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] text-space-400 block">RAW WEIGHTED</span>
                <span className="text-sm font-bold text-space-300 font-telemetry">{selectedEvaluation.weighted_score}</span>
              </div>
              <div className="text-right pl-3 border-l border-space-800">
                <span className="text-[10px] text-space-400 block">FINAL OPERATIONAL SCORE</span>
                <span className={`text-xl font-bold font-telemetry ${selectedEvaluation.exclusion.is_excluded ? 'text-red-400' : 'text-cyan-300'}`}>
                  {selectedEvaluation.final_score} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Individual Factor Breakdown (0-100) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
            {[
              { label: 'Slope Score', score: selectedEvaluation.factor_scores.slope_score, weight: weights.slope },
              { label: 'Terrain Safety', score: selectedEvaluation.factor_scores.terrain_safety_score, weight: weights.terrain },
              { label: 'Illumination', score: selectedEvaluation.factor_scores.illumination_score, weight: weights.illumination },
              { label: 'Crater Avoidance', score: selectedEvaluation.factor_scores.crater_avoidance_score, weight: weights.crater_avoidance },
              { label: 'Accessibility', score: selectedEvaluation.factor_scores.accessibility_score, weight: weights.accessibility },
            ].map((f, i) => (
              <div key={i} className="bg-space-950 p-2.5 rounded border border-space-800 space-y-1">
                <span className="text-[10px] text-space-400 block truncate">{f.label}</span>
                <div className="text-lg font-bold text-white font-telemetry">{f.score}</div>
                <div className="w-full bg-space-850 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${f.score >= 75 ? 'bg-emerald-400' : f.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <span className="text-[9px] text-space-400 block">Weight: {(f.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* Hard Exclusion Results or Recommendation Explanation */}
          {selectedEvaluation.exclusion.is_excluded ? (
            <div className="bg-red-950/60 border border-red-800 p-3 rounded text-red-300 text-[11px] space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>SAFETY EXCLUSION VIOLATIONS:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[10px]">
                {selectedEvaluation.exclusion.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded text-emerald-300 text-[11px] space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>SAFETY COMPLIANCE VERIFICATION:</span>
              </div>
              <p className="text-[10px] text-space-300 leading-relaxed">
                {selectedEvaluation.recommendation_summary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Evaluated Sites List */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-space-800">
          <span className="text-space-200 font-semibold">ALL EVALUATED CANDIDATE SITES ({evaluations.length})</span>
          <span className="text-[10px] text-space-400">CLICK ROW TO INSPECT EXPLANATION</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-space-800 text-space-400 text-[10px] uppercase bg-space-950/60">
                <th className="py-2 px-3">Site</th>
                <th className="py-2 px-3">Slope Score</th>
                <th className="py-2 px-3">Terrain</th>
                <th className="py-2 px-3">Illumination</th>
                <th className="py-2 px-3">Crater Avoid</th>
                <th className="py-2 px-3">Accessibility</th>
                <th className="py-2 px-3">Exclusion</th>
                <th className="py-2 px-3">Final Score</th>
                <th className="py-2 px-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-850 text-[11px]">
              {evaluations.map((e) => {
                const isSelected = selectedEvaluation?.site.id === e.site.id;
                const isEx = e.exclusion.is_excluded;
                return (
                  <tr
                    key={e.site.id}
                    onClick={() => setSelectedEvaluation(e)}
                    className={`cursor-pointer transition ${
                      isSelected ? 'bg-space-800 text-cyan-200' : 'hover:bg-space-850/60'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <div className="font-bold">{e.site.name}</div>
                      <div className="text-[10px] text-space-400">{e.site.code}</div>
                    </td>
                    <td className="py-2 px-3 font-telemetry">{e.factor_scores.slope_score}</td>
                    <td className="py-2 px-3 font-telemetry">{e.factor_scores.terrain_safety_score}</td>
                    <td className="py-2 px-3 font-telemetry">{e.factor_scores.illumination_score}</td>
                    <td className="py-2 px-3 font-telemetry">{e.factor_scores.crater_avoidance_score}</td>
                    <td className="py-2 px-3 font-telemetry">{e.factor_scores.accessibility_score}</td>
                    <td className="py-2 px-3">
                      {isEx ? (
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[9px] font-bold">
                          VIOLATION
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold">
                          CLEAR
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold font-telemetry">
                      <span className={isEx ? 'text-red-400' : 'text-cyan-300'}>{e.final_score}</span>
                    </td>
                    <td className="py-2 px-3 text-[10px] font-medium">
                      <span className={isEx ? 'text-red-400' : 'text-space-300'}>{e.recommendation}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
