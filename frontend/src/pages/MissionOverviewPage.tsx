import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { MissionOverviewData, EvaluationResult } from '../types';
import {
  LayoutDashboard,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  ArrowRight,
  Database,
  Sun,
  Mountain,
  Activity,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const MissionOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<MissionOverviewData | null>(null);
  const [rankedSites, setRankedSites] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ovData, sitesData] = await Promise.all([
          apiService.getMissionOverview(),
          apiService.getSites()
        ]);
        setOverview(ovData);
        setRankedSites(sitesData);
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !overview) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs text-cyan-400">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        INGESTING LUNAR MISSION TELEMETRY...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Top Banner / Objective */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel">
        <div className="flex items-center justify-between pb-2 border-b border-space-800 mb-3">
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Mission Operations & Landing Site Intelligence Overview
            </h1>
          </div>
          <span className="text-[11px] text-space-400">
            SYSTEM STATUS: <strong className="text-emerald-400">{overview.analysis_completion_status}</strong>
          </span>
        </div>
        <p className="text-space-300 leading-relaxed text-[11px]">
          {overview.mission_objective}
        </p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block uppercase">CANDIDATE SITES</span>
          <div className="text-2xl font-bold text-white mt-1">{overview.candidate_sites_total}</div>
          <span className="text-[10px] text-space-400 mt-1 block">Surveyed in 80°S-90°S Cap</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block uppercase">PASSING HARD CONSTRAINTS</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{overview.candidate_sites_passing}</div>
          <span className="text-[10px] text-emerald-500/80 mt-1 block">Zero safety violations</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block uppercase">DISQUALIFIED SITES</span>
          <div className="text-2xl font-bold text-red-400 mt-1">{overview.candidate_sites_excluded}</div>
          <span className="text-[10px] text-red-400/80 mt-1 block">Failed slope/hazard/PSR bounds</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block uppercase">TOP CANDIDATE SCORE</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {overview.highest_scoring_candidate?.score || 0}
            <span className="text-xs text-space-400 font-normal"> / 100</span>
          </div>
          <span className="text-[10px] text-cyan-400/80 truncate mt-1 block">
            {overview.highest_scoring_candidate?.name}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Hazard Distribution & Environmental Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hazard Distribution Chart */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="flex items-center space-x-2 text-space-200 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>OVERALL HAZARD DISTRIBUTION</span>
            </div>
            <span className="text-[10px] text-space-400">15 SURVEYED ZONES</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview.overall_hazard_summary.hazard_distribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                  {overview.overall_hazard_summary.hazard_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-space-800 text-[10px]">
            <div className="bg-space-950 p-2 rounded border border-space-850">
              <span className="text-space-400 block">NOMINAL</span>
              <span className="text-emerald-400 font-bold text-sm">
                {overview.overall_hazard_summary.nominal_safety_count} Sites
              </span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-850">
              <span className="text-space-400 block">ELEVATED</span>
              <span className="text-amber-400 font-bold text-sm">
                {overview.overall_hazard_summary.elevated_risk_count} Sites
              </span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-850">
              <span className="text-space-400 block">CRITICAL</span>
              <span className="text-red-400 font-bold text-sm">
                {overview.overall_hazard_summary.critical_hazard_count} Sites
              </span>
            </div>
          </div>
        </div>

        {/* Illumination & Topographical Statistics */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="flex items-center space-x-2 text-space-200 font-semibold">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>POLAR ENVIRONMENT & DATA PROVENANCE</span>
            </div>
            <span className="text-[10px] text-space-400">EPSG:75400</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-space-950 p-2.5 rounded border border-space-800 space-y-1">
              <span className="text-space-400 text-[10px] flex items-center space-x-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>MEAN ANNUAL SUNLIGHT</span>
              </span>
              <div className="text-lg font-bold text-amber-300">
                {overview.illumination_stats.mean_annual_illumination_pct}%
              </div>
              <span className="text-[9px] text-space-400 block">
                {overview.illumination_stats.high_illumination_sites_count} sites with &gt; 80% solar fraction
              </span>
            </div>

            <div className="bg-space-950 p-2.5 rounded border border-space-800 space-y-1">
              <span className="text-space-400 text-[10px] flex items-center space-x-1">
                <Mountain className="w-3 h-3 text-cyan-400" />
                <span>MEAN MACRO SLOPE</span>
              </span>
              <div className="text-lg font-bold text-cyan-300">
                {overview.terrain_stats.mean_slope_deg}°
              </div>
              <span className="text-[9px] text-space-400 block">
                LOLA laser altimetry baselines
              </span>
            </div>

            <div className="bg-space-950 p-2.5 rounded border border-space-800 space-y-1">
              <span className="text-space-400 text-[10px]">ELEVATION RANGE</span>
              <div className="text-sm font-bold text-space-200">
                {overview.terrain_stats.lowest_elevation_m}m to +{overview.terrain_stats.highest_elevation_m}m
              </div>
              <span className="text-[9px] text-space-400 block">Relief relative to 1737.4 km</span>
            </div>

            <div className="bg-space-950 p-2.5 rounded border border-space-800 space-y-1">
              <span className="text-space-400 text-[10px]">SCIENTIFIC DATASETS</span>
              <div className="text-sm font-bold text-space-200">
                {overview.datasets_available_count} Ingested Catalogs
              </div>
              <span className="text-[9px] text-space-400 block">
                {overview.craters_mapped_count} Major polar craters mapped
              </span>
            </div>
          </div>

          <div className="bg-space-850 p-2.5 rounded border border-space-750 text-[10px] text-space-400 flex items-center justify-between">
            <span>DATA PROVENANCE: 4 REAL NASA LRO / 2 SIMULATED</span>
            <button
              onClick={() => navigate('/datasets')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
            >
              <span>View Data Provenance</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Site Ranking Table */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-space-800">
          <div className="flex items-center space-x-2 text-space-200 font-semibold">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>CANDIDATE LANDING SITE SUITABILITY RANKINGS</span>
          </div>
          <button
            onClick={() => navigate('/navigator')}
            className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs"
          >
            <span>Open in Lunar Navigator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-space-800 text-space-400 text-[10px] uppercase bg-space-950/60">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Code / Site Name</th>
                <th className="py-2 px-3">Coordinates</th>
                <th className="py-2 px-3">Mean Slope</th>
                <th className="py-2 px-3">Sunlight</th>
                <th className="py-2 px-3">Clearance</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Suitability Score</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-850 text-[11px]">
              {rankedSites.map((evalResult, idx) => {
                const s = evalResult.site;
                const isDisqualified = evalResult.exclusion.is_excluded;
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-space-850/60 transition cursor-pointer"
                    onClick={() => navigate(`/navigator`)}
                  >
                    <td className="py-2 px-3 font-bold text-space-400">#{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-white">{s.name}</div>
                      <div className="text-[10px] text-space-400">{s.code} • {s.region}</div>
                    </td>
                    <td className="py-2 px-3 font-telemetry text-cyan-300">
                      {s.lat.toFixed(2)}° S, {s.lon.toFixed(2)}° E
                    </td>
                    <td className="py-2 px-3">
                      <span className={s.slope_mean_deg > 8.0 ? 'text-amber-400 font-bold' : 'text-space-300'}>
                        {s.slope_mean_deg}°
                      </span>
                    </td>
                    <td className="py-2 px-3 text-amber-300">{s.illumination_annual_pct}%</td>
                    <td className="py-2 px-3">{s.landing_clearance_m} m</td>
                    <td className="py-2 px-3">
                      {isDisqualified ? (
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded text-[9px] font-bold">
                          EXCLUDED
                        </span>
                      ) : evalResult.risk_classification === 'NOMINAL' ? (
                        <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold">
                          NOMINAL
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 rounded text-[9px] font-bold">
                          CAUTION
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${isDisqualified ? 'text-red-400' : 'text-cyan-300'}`}>
                          {evalResult.final_score}
                        </span>
                        <div className="w-16 h-1.5 bg-space-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isDisqualified ? 'bg-red-500' : 'bg-cyan-400'}`}
                            style={{ width: `${Math.min(100, evalResult.final_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/evaluation?site=${s.id}`);
                        }}
                        className="px-2 py-1 bg-space-800 hover:bg-space-750 text-space-200 hover:text-cyan-300 border border-space-700 rounded text-[10px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-2">
        <div className="flex items-center space-x-2 text-space-300 font-semibold pb-1.5 border-b border-space-800">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>REAL-TIME ANALYSIS AUDIT LOG</span>
        </div>
        <div className="space-y-1">
          {overview.recent_activity.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-space-850/40 text-[11px]">
              <div className="flex items-center space-x-2">
                <span className="text-space-400 font-telemetry">{item.time}</span>
                <span className="text-space-200">{item.event}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                item.status === 'VERIFIED' || item.status === 'NOMINAL' || item.status === 'COMPLETED'
                  ? 'text-emerald-400 bg-emerald-950/60'
                  : 'text-amber-400 bg-amber-950/60'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
