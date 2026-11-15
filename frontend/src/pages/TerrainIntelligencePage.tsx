import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { SiteDetail, Site } from '../types';
import {
  Mountain,
  Sliders,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const TerrainIntelligencePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSiteId = searchParams.get('site') || 'site-008';

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(requestedSiteId);
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configurable slope assessment limit
  const [slopeLimit, setSlopeLimit] = useState<number>(10.0);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const list = await apiService.getSites();
        setSites(list.map(e => e.site));
      } catch (err) {
        console.error('Failed to fetch sites', err);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSiteDetail(selectedSiteId);
        setSiteDetail(data);
      } catch (err) {
        console.error('Failed to fetch site detail', err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedSiteId) {
      fetchDetail();
    }
  }, [selectedSiteId]);

  const handleSiteChange = (newId: string) => {
    setSelectedSiteId(newId);
    setSearchParams({ site: newId });
  };

  if (loading || !siteDetail) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs text-cyan-400">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        COMPUTING LOLA TOPOGRAPHICAL TRANSECTS & SLOPE PROFILES...
      </div>
    );
  }

  const { site, elevation_profile, slope_distribution, clearance_envelope, hazard_breakdown } = siteDetail;

  const isSlopeExceeded = site.slope_mean_deg > slopeLimit;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Page Title & Site Selector */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Mountain className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Terrain Intelligence & Topographical Assessment
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            LOLA Altimetric Profiling (20m GDR) & Stochastic Micro-Relief Analysis
          </span>
        </div>

        {/* Site Picker Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] text-space-400">SELECT CANDIDATE:</label>
          <select
            value={selectedSiteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="bg-space-800 border border-space-700 text-cyan-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name} ({s.region})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Configurable Slope Assessment Banner */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-space-800">
          <div className="flex items-center space-x-2 text-space-200 font-semibold">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>CONFIGURABLE SLOPE ASSESSMENT ENVELOPE</span>
          </div>
          <span className="text-[10px] text-space-400">THRESHOLD: <strong className="text-cyan-300">{slopeLimit}°</strong></span>
        </div>

        <div className="flex items-center space-x-4 pt-1">
          <span className="text-[11px] text-space-400">Lander Tilt Limit:</span>
          <input
            type="range"
            min="3.0"
            max="18.0"
            step="0.5"
            value={slopeLimit}
            onChange={(e) => setSlopeLimit(parseFloat(e.target.value))}
            className="w-64 accent-cyan-400 cursor-pointer"
          />
          <span className="text-xs font-bold text-cyan-300 font-telemetry">{slopeLimit.toFixed(1)}°</span>

          <div className="flex-1 text-right">
            {isSlopeExceeded ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-950 border border-red-800 text-red-400 rounded text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>UNACCEPTABLE: Mean slope ({site.slope_mean_deg}°) exceeds {slopeLimit}° limit</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded text-[11px] font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>COMPLIANT: Mean slope ({site.slope_mean_deg}°) within {slopeLimit}° envelope</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts: Elevation Profile & Slope Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Elevation Transect Chart */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div>
              <div className="text-space-200 font-semibold">CROSS-SECTION ELEVATION PROFILE (W-E TRANSECT)</div>
              <div className="text-[9px] text-space-400 flex items-center space-x-2 mt-0.5">
                <span className="text-emerald-400">REAL LOLA MACRO</span>
                <span>•</span>
                <span className="text-amber-400">SIMULATED MICRO-RELIEF</span>
              </div>
            </div>
            <span className="text-[10px] text-space-400">DATUM: 1737.4 km</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elevation_profile} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="distance_km" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Radial Offset (km)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: number) => [`${val} m`, 'Elevation']}
                  labelFormatter={(lbl: number) => `Offset: ${lbl} km`}
                />
                <Area type="monotone" dataKey="elevation_m" stroke="#22d3ee" fillOpacity={1} fill="url(#elevGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-space-800 flex justify-between text-[10px] text-space-400">
            <span>Center Elevation: <strong className="text-cyan-300">{site.elevation_m} m</strong></span>
            <span>Peak Slope Along Track: <strong className="text-space-200">{site.slope_max_deg}°</strong></span>
          </div>
        </div>

        {/* Slope Distribution Histogram */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div>
              <div className="text-space-200 font-semibold">FOOTPRINT SLOPE DISTRIBUTION (HISTOGRAM)</div>
              <div className="text-[9px] text-amber-400 mt-0.5">SIMULATED (WEIBULL REGOLITH MODEL)</div>
            </div>
            <span className="text-[10px] text-space-400">1 km RADIUS</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slope_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Area (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(val: number) => [`${val}%`, 'Surface Area']}
                />
                <Bar dataKey="percentage" radius={[2, 2, 0, 0]}>
                  {slope_distribution.map((entry, index) => {
                    const color = index <= 1 ? '#10b981' : index === 2 ? '#f59e0b' : '#ef4444';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-space-800 flex justify-between text-[10px] text-space-400">
            <span>Mean Slope: <strong className="text-cyan-300">{site.slope_mean_deg}°</strong></span>
            <span>Max Localized Gradient: <strong className="text-space-200">{site.slope_max_deg}°</strong></span>
          </div>
        </div>
      </div>

      {/* Surface Roughness, Clearance & Crater Proximity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Clearance Envelope */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-2.5">
          <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 flex justify-between">
            <span>LANDING CLEARANCE ENVELOPE</span>
            <span className="text-[9px] text-amber-400 font-bold">SIMULATED</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-space-400">Available Flat Radius:</span>
              <strong className="text-cyan-300">{clearance_envelope.available_clearance_m} m</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Required Radius (100m Footprint):</span>
              <strong className="text-space-200">{clearance_envelope.required_radius_m} m</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Safety Clearance Margin:</span>
              <strong className={clearance_envelope.margin_m >= 20 ? 'text-emerald-400' : 'text-red-400'}>
                +{clearance_envelope.margin_m} m
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Clearance Status:</span>
              <strong className={clearance_envelope.clearance_status === 'CLEAR' ? 'text-emerald-400' : 'text-amber-400'}>
                {clearance_envelope.clearance_status}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Est. Boulders &gt; 1m:</span>
              <strong className="text-space-200">{clearance_envelope.boulder_count_est_over_1m} objects</strong>
            </div>
          </div>
        </div>

        {/* Roughness & Regolith */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-2.5">
          <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 flex justify-between">
            <span>SURFACE ROUGHNESS & SCARPS</span>
            <span className="text-[9px] text-emerald-400 font-bold">REAL LOLA</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-space-400">RMS Surface Roughness:</span>
              <strong className="text-space-200">{site.surface_roughness_m} m</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Hazard Density Factor:</span>
              <strong className={site.hazard_density > 0.4 ? 'text-red-400' : 'text-space-200'}>
                {site.hazard_density} (max 1.0)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Lander Tipping Margin:</span>
              <strong className="text-cyan-300">{hazard_breakdown.tipping_angle_margin_deg}°</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Slope Stability Risk:</span>
              <strong className={hazard_breakdown.slope_stability_risk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}>
                {hazard_breakdown.slope_stability_risk}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Overall Hazard Level:</span>
              <strong className={hazard_breakdown.overall_hazard_level === 'NOMINAL' ? 'text-emerald-400' : 'text-amber-400'}>
                {hazard_breakdown.overall_hazard_level}
              </strong>
            </div>
          </div>
        </div>

        {/* Crater Proximity */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-2.5">
          <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 flex justify-between">
            <span>CRATER PROXIMITY & RIM HAZARD</span>
            <span className="text-[9px] text-emerald-400 font-bold">REAL IAU</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-space-400">Nearest Major Feature:</span>
              <strong className="text-cyan-300">{site.nearest_crater} Crater</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Distance to Rim:</span>
              <strong className="text-space-200">{site.crater_proximity_km} km</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Rim Gradient Risk:</span>
              <strong className={hazard_breakdown.rim_proximity_risk === 'MINIMAL' ? 'text-emerald-400' : 'text-amber-400'}>
                {hazard_breakdown.rim_proximity_risk}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Data Confidence:</span>
              <strong className="text-emerald-400">{site.data_confidence_pct}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-space-400">Topography Source:</span>
              <strong className="text-space-200">{site.provenance.topography}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
