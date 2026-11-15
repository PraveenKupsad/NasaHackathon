import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { ComparisonResponse, Site } from '../types';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Plus,
  Trash2,
  Award
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

export const SiteComparisonPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSites = searchParams.get('sites');

  const defaultSiteIds = paramSites
    ? paramSites.split(',').filter(Boolean)
    : ['site-008', 'site-002', 'site-004']; // Malapert, Shackleton Peak, Connecting Ridge Ext

  const [availableSites, setAvailableSites] = useState<Site[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSiteIds);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load all sites for the dropdown selector
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const evals = await apiService.getSites();
        setAvailableSites(evals.map(e => e.site));
      } catch (err) {
        console.error('Failed to load sites', err);
      }
    };
    fetchSites();
  }, []);

  // Run Comparison when selectedIds change
  useEffect(() => {
    const runCompare = async () => {
      if (selectedIds.length < 2) return;
      try {
        setLoading(true);
        const data = await apiService.compareSites({
          site_ids: selectedIds,
        });
        setComparison(data);
      } catch (err) {
        console.error('Failed to compare sites', err);
      } finally {
        setLoading(false);
      }
    };
    runCompare();
  }, [selectedIds]);

  const handleAddSite = (siteId: string) => {
    if (!selectedIds.includes(siteId)) {
      const next = [...selectedIds, siteId];
      setSelectedIds(next);
      setSearchParams({ sites: next.join(',') });
    }
  };

  const handleRemoveSite = (siteId: string) => {
    if (selectedIds.length <= 2) return; // Keep at least 2
    const next = selectedIds.filter(id => id !== siteId);
    setSelectedIds(next);
    setSearchParams({ sites: next.join(',') });
  };

  // Build Radar Chart Data Structure
  // [ { subject: 'Slope', 'Site 1': 95, 'Site 2': 65, ... } ]
  const radarFactors = [
    { key: 'slope_score', label: 'Slope Suitability' },
    { key: 'terrain_safety_score', label: 'Terrain Safety' },
    { key: 'illumination_score', label: 'Illumination' },
    { key: 'crater_avoidance_score', label: 'Crater Avoidance' },
    { key: 'accessibility_score', label: 'Accessibility' },
  ];

  const radarChartData = radarFactors.map((f) => {
    const entry: Record<string, any> = { subject: f.label };
    comparison?.sites.forEach((s) => {
      // @ts-ignore
      entry[s.site.code] = s.factor_scores[f.key];
    });
    return entry;
  });

  const colors = ['#22d3ee', '#f59e0b', '#a855f7', '#10b981', '#f43f5e'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Page Header & Site Management Bar */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Multi-Candidate Landing Site Comparison
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            Comparative Trade-Off Matrix & Objective Multi-Factor Evaluation
          </span>
        </div>

        {/* Add Candidate Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] text-space-400">ADD CANDIDATE:</label>
          <select
            onChange={(e) => {
              if (e.target.value) handleAddSite(e.target.value);
            }}
            value=""
            className="bg-space-800 border border-space-700 text-cyan-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
          >
            <option value="" disabled>-- Select Site to Add --</option>
            {availableSites
              .filter(s => !selectedIds.includes(s.id))
              .map(s => (
                <option key={s.id} value={s.id}>
                  + {s.code} - {s.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Recommended Winner Banner (Respecting Hard Exclusions) */}
      {comparison && (
        <div className="bg-space-900 border border-cyan-800/80 rounded-sm p-4 shadow-panel space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Award className="w-4 h-4" />
              <span>ALGORITHMIC RECOMMENDATION RATIONALE</span>
            </div>
            {comparison.recommended_site_id ? (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-bold">
                PRIME TARGET IDENTIFIED
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-bold">
                NO SAFE CANDIDATE
              </span>
            )}
          </div>
          <p className="text-space-200 text-[11px] leading-relaxed">
            {comparison.recommendation_rationale}
          </p>
        </div>
      )}

      {loading || !comparison ? (
        <div className="h-64 flex items-center justify-center font-mono text-xs text-cyan-400">
          <Activity className="w-5 h-5 animate-spin mr-2" />
          GENERATING COMPARISON TRADE-OFF MATRIX...
        </div>
      ) : (
        <>
          {/* Radar Chart & High-Level Comparison Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Radar Chart Overlay (5 Columns) */}
            <div className="lg:col-span-5 bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
                <span className="text-space-200 font-semibold">MULTI-FACTOR RADAR PROFILE</span>
                <span className="text-[9px] text-space-400">0 - 100 NORMALIZED</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                    <PolarGrid stroke="#1e293b" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    {comparison.sites.map((s, idx) => (
                      <Radar
                        key={s.site.id}
                        name={s.site.code}
                        dataKey={s.site.code}
                        stroke={colors[idx % colors.length]}
                        fill={colors[idx % colors.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Factor Comparison Table (7 Columns) */}
            <div className="lg:col-span-7 bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-2 overflow-x-auto">
              <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
                <span className="text-space-200 font-semibold">SIDE-BY-SIDE ENGINEERING MATRIX</span>
                <span className="text-[10px] text-space-400">{comparison.sites.length} CANDIDATES</span>
              </div>

              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-space-800 text-space-400 text-[10px] uppercase bg-space-950/60">
                    <th className="py-1.5 px-2">Metric</th>
                    {comparison.sites.map((s) => (
                      <th key={s.site.id} className="py-1.5 px-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{s.site.code}</span>
                          {selectedIds.length > 2 && (
                            <button
                              onClick={() => handleRemoveSite(s.site.id)}
                              className="text-space-500 hover:text-red-400 ml-1"
                              title="Remove site"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-space-850">
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Site Name</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2 font-bold truncate max-w-[120px]">{s.site.name}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Coordinates</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2 font-telemetry text-cyan-300">
                        {s.site.lat.toFixed(1)}°S, {s.site.lon.toFixed(1)}°E
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Mean / Max Slope</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2">
                        <span className={s.site.slope_mean_deg > 8.0 ? 'text-amber-400' : 'text-space-200'}>
                          {s.site.slope_mean_deg}° / {s.site.slope_max_deg}°
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Annual Sunlight</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2 font-bold text-amber-300">
                        {s.site.illumination_annual_pct}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Earth LOS Comm</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2">{s.site.earth_los_pct}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Clearance Radius</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2">{s.site.landing_clearance_m} m</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Crater Proximity</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2">{s.site.crater_proximity_km} km ({s.site.nearest_crater})</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Data Confidence</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2 text-emerald-400">{s.site.data_confidence_pct}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1.5 px-2 text-space-400">Hard Exclusion</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-1.5 px-2">
                        {s.exclusion.is_excluded ? (
                          <span className="text-red-400 font-bold flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAILED</span>
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>PASSED</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-space-950 font-bold">
                    <td className="py-2 px-2 text-space-200">Final Operational Score</td>
                    {comparison.sites.map(s => (
                      <td key={s.site.id} className="py-2 px-2">
                        <span className={`text-sm ${s.exclusion.is_excluded ? 'text-red-400' : 'text-cyan-300'}`}>
                          {s.final_score} / 100
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Strengths & Weaknesses Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparison.sites.map((s, idx) => {
              const profile = comparison.tradeoff_matrix[s.site.id];
              const isPrime = s.site.id === comparison.recommended_site_id;
              return (
                <div
                  key={s.site.id}
                  className={`bg-space-900 border rounded-sm p-4 shadow-panel space-y-3 ${
                    isPrime ? 'border-cyan-500' : 'border-space-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
                    <div>
                      <div className="font-bold text-white text-xs">{s.site.name}</div>
                      <div className="text-[10px] text-space-400">{s.site.code} • {s.site.region}</div>
                    </div>
                    {isPrime && (
                      <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded text-[9px] font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  {/* Strengths */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Key Strengths</span>
                    <ul className="space-y-0.5 text-[10px] text-space-300">
                      {profile?.strengths.map((str, i) => (
                        <li key={i} className="flex items-start space-x-1.5">
                          <span className="text-emerald-400 shrink-0">+</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-1 pt-1 border-t border-space-850">
                    <span className="text-[10px] text-amber-400 font-semibold block uppercase">Trade-Offs / Risks</span>
                    <ul className="space-y-0.5 text-[10px] text-space-300">
                      {profile?.weaknesses.length === 0 ? (
                        <li className="text-space-500 italic">No significant operational weaknesses identified.</li>
                      ) : (
                        profile?.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <span className="text-red-400 shrink-0">-</span>
                            <span>{w}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
