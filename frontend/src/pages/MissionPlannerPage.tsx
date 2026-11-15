import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { MissionConfig, EvaluationResult } from '../types';
import {
  Sliders,
  Play,
  Save,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Activity,
  ArrowRight
} from 'lucide-react';

export const MissionPlannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: 'Artemis Crewed Sortie',
    mission_identifier: 'ART-SP-2026A',
    footprint_diameter_m: 100.0,
    max_acceptable_slope: 10.0,
    min_illumination_req: 20.0,
    max_hazard_tolerance: 0.50,
    mission_duration_days: 14,
    require_earth_los: true,
  });

  const [savedConfigs, setSavedConfigs] = useState<MissionConfig[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [passingCount, setPassingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      const list = await apiService.getMissionConfigs();
      setSavedConfigs(list);
    } catch (err) {
      console.error('Failed to fetch configs', err);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleRunAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMsg('PERSISTING MISSION CONFIGURATION & EVALUATING SITES...');
      const res = await apiService.configureMission(formData);
      // Run analysis with new config
      const evals = await apiService.analyzeSites({
        max_slope_deg: (res as MissionConfig).max_acceptable_slope,
        min_illumination_pct: (res as MissionConfig).min_illumination_req,
        max_hazard_tolerance: (res as MissionConfig).max_hazard_tolerance,
        landing_footprint_m: (res as MissionConfig).footprint_diameter_m,
        require_earth_los: (res as MissionConfig).require_earth_los,
      });
      const passing = evals.filter((e: EvaluationResult) => !e.exclusion.is_excluded).length;
      setEvaluations(evals);
      setPassingCount(passing);
      setStatusMsg(`MISSION CONFIGURED: ${passing} of ${evals.length} sites compliant.`);
      fetchConfigs();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message || 'Execution failed'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConfig = (cfg: MissionConfig) => {
    setFormData({
      name: cfg.name,
      mission_identifier: cfg.mission_identifier,
      footprint_diameter_m: cfg.footprint_diameter_m,
      max_acceptable_slope: cfg.max_acceptable_slope,
      min_illumination_req: cfg.min_illumination_req,
      max_hazard_tolerance: cfg.max_hazard_tolerance,
      mission_duration_days: cfg.mission_duration_days,
      require_earth_los: cfg.require_earth_los,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Title */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            Mission Planner & Flight Parameters Setup
          </h1>
        </div>
        <span className="text-[10px] text-space-400 mt-0.5 block">
          Custom Mission Constraint Specification, SQLite Persistence & Live Engineering Site Re-Evaluation
        </span>
      </div>

      {/* Two Column Grid: Mission Form & Saved Configs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Configuration Form (7 Columns) */}
        <form onSubmit={handleRunAndSave} className="lg:col-span-7 bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <span className="text-space-200 font-semibold uppercase">Mission Constraints & Lander Specs</span>
            <span className="text-[10px] text-space-400">PARAMETERS PERSISTED TO SQLITE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-space-400 text-[10px] block mb-1">MISSION NAME</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">MISSION IDENTIFIER</label>
              <input
                type="text"
                value={formData.mission_identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, mission_identifier: e.target.value }))}
                required
                className="w-full bg-space-800 border border-space-700 text-cyan-300 font-telemetry px-2.5 py-1.5 rounded text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">LANDING FOOTPRINT DIAMETER (m)</label>
              <input
                type="number"
                min="20"
                max="500"
                step="5"
                value={formData.footprint_diameter_m}
                onChange={(e) => setFormData(prev => ({ ...prev, footprint_diameter_m: parseFloat(e.target.value) || 100 }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs font-telemetry focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">MAX ACCEPTABLE SLOPE (deg)</label>
              <input
                type="number"
                min="2"
                max="30"
                step="0.5"
                value={formData.max_acceptable_slope}
                onChange={(e) => setFormData(prev => ({ ...prev, max_acceptable_slope: parseFloat(e.target.value) || 10 }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs font-telemetry focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">MIN ILLUMINATION REQ (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                step="5"
                value={formData.min_illumination_req}
                onChange={(e) => setFormData(prev => ({ ...prev, min_illumination_req: parseFloat(e.target.value) || 20 }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs font-telemetry focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">MAX HAZARD TOLERANCE (0-1.0)</label>
              <input
                type="number"
                min="0.05"
                max="1.0"
                step="0.05"
                value={formData.max_hazard_tolerance}
                onChange={(e) => setFormData(prev => ({ ...prev, max_hazard_tolerance: parseFloat(e.target.value) || 0.5 }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs font-telemetry focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-space-400 text-[10px] block mb-1">MISSION DURATION (DAYS)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.mission_duration_days}
                onChange={(e) => setFormData(prev => ({ ...prev, mission_duration_days: parseInt(e.target.value) || 14 }))}
                required
                className="w-full bg-space-800 border border-space-700 text-white px-2.5 py-1.5 rounded text-xs font-telemetry focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="earthLos"
                checked={formData.require_earth_los}
                onChange={(e) => setFormData(prev => ({ ...prev, require_earth_los: e.target.checked }))}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
              <label htmlFor="earthLos" className="text-space-200 text-xs cursor-pointer">
                Require Direct Earth LOS Comm
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-space-800 flex items-center justify-between">
            <span className="text-[11px] text-space-400">
              {statusMsg || 'Ready to run evaluation.'}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow transition flex items-center space-x-1.5"
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Run Site Evaluation & Save</span>
            </button>
          </div>
        </form>

        {/* Saved Configurations in SQLite (5 Columns) */}
        <div className="lg:col-span-5 bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-space-800">
              <div className="flex items-center space-x-2 text-space-200 font-semibold">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="uppercase">Saved Mission Configurations</span>
              </div>
              <span className="text-[10px] text-space-400">{savedConfigs.length} PRESETS</span>
            </div>

            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
              {savedConfigs.length === 0 ? (
                <div className="text-space-500 text-[11px] py-4 text-center">
                  No mission configs saved yet. Run the evaluation to save one.
                </div>
              ) : (
                savedConfigs.map((cfg) => (
                  <div
                    key={cfg.id}
                    onClick={() => handleLoadConfig(cfg)}
                    className="p-2.5 bg-space-850 hover:bg-space-800 border border-space-750 hover:border-space-600 rounded transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{cfg.name}</span>
                      <span className="text-[10px] text-cyan-300 font-telemetry">{cfg.mission_identifier}</span>
                    </div>
                    <div className="text-[10px] text-space-400 flex justify-between">
                      <span>Max Slope: {cfg.max_acceptable_slope}°</span>
                      <span>Min Illum: {cfg.min_illumination_req}%</span>
                      <span>Duration: {cfg.mission_duration_days}d</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-space-800 text-[10px] text-space-400">
            Backed by SQLite database at <code className="text-space-300">backend/lunanav.db</code>
          </div>
        </div>
      </div>

      {/* Immediate Evaluation Results Under This Mission Setup */}
      {evaluations.length > 0 && (
        <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="flex items-center space-x-2 text-space-200 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>
                EVALUATION RESULTS FOR {formData.mission_identifier} ({passingCount} SITES PASSING)
              </span>
            </div>
            <button
              onClick={() => navigate('/comparison')}
              className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center space-x-1"
            >
              <span>Compare Top Sites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-space-800 text-space-400 text-[10px] uppercase bg-space-950/60">
                  <th className="py-2 px-3">Site</th>
                  <th className="py-2 px-3">Mean Slope</th>
                  <th className="py-2 px-3">Sunlight</th>
                  <th className="py-2 px-3">Clearance Margin</th>
                  <th className="py-2 px-3">Exclusion Status</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-850">
                {evaluations.map((e) => {
                  const isEx = e.exclusion.is_excluded;
                  return (
                    <tr key={e.site.id} className="hover:bg-space-850/60">
                      <td className="py-2 px-3 font-bold text-white">
                        {e.site.name} <span className="text-space-400 font-normal">({e.site.code})</span>
                      </td>
                      <td className="py-2 px-3">{e.site.slope_mean_deg}°</td>
                      <td className="py-2 px-3 text-amber-300">{e.site.illumination_annual_pct}%</td>
                      <td className="py-2 px-3">{e.site.landing_clearance_m} m</td>
                      <td className="py-2 px-3">
                        {isEx ? (
                          <span className="text-red-400 font-bold">FAIL (EXCLUDED)</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">PASS</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold font-telemetry">
                        <span className={isEx ? 'text-red-400' : 'text-cyan-300'}>{e.final_score}</span>
                      </td>
                      <td className="py-2 px-3 text-[10px] text-space-300 truncate max-w-xs">
                        {isEx ? e.exclusion.reasons[0] : e.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
