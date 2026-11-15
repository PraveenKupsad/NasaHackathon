import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { SiteDetail, Site } from '../types';
import {
  Sun,
  BatteryCharging,
  ThermometerSnowflake,
  ShieldAlert,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const IlluminationAnalysisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSiteId = searchParams.get('site') || 'site-008';

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(requestedSiteId);
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
        COMPUTING LROC WAC SOLAR ELEVATION & VOLATILE STABILITY MODELS...
      </div>
    );
  }

  const { site, solar_timeline, solar_summary } = siteDetail;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Page Title & Site Selector */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Illumination Dynamics & Solar Power Operations
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            LROC WAC Empirical Solar Fractions & Orbital Solar Azimuth/Elevation Time-Series
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

      {/* Primary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block">ANNUAL SUNLIGHT FRACTION</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{site.illumination_annual_pct}%</div>
          <span className="text-[10px] text-space-400 mt-1 block">REAL (LROC WAC 1200 orbits)</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block">SUMMER SOLSTICE PEAK</span>
          <div className="text-2xl font-bold text-yellow-300 mt-1">{site.illumination_summer_pct}%</div>
          <span className="text-[10px] text-space-400 mt-1 block">Sub-solar latitude -1.54°</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block">LONGEST SHADOW DURATION</span>
          <div className="text-2xl font-bold text-space-200 mt-1">
            {solar_summary.longest_consecutive_shadow_hours} <span className="text-xs text-space-400">hrs</span>
          </div>
          <span className="text-[10px] text-space-400 mt-1 block">Max battery survival window</span>
        </div>

        <div className="bg-space-900 border border-space-700 p-3 rounded-sm shadow-panel">
          <span className="text-space-400 text-[10px] block">EST. BATTERY MASS REQ.</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            {solar_summary.estimated_battery_mass_kg} <span className="text-xs text-space-400">kg</span>
          </div>
          <span className="text-[10px] text-space-400 mt-1 block">For 500W hotel payload</span>
        </div>
      </div>

      {/* Main Graph: Annual Illumination & Solar Power Timeline */}
      <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-space-800">
          <div>
            <div className="text-space-200 font-semibold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>ANNUAL ILLUMINATION FRACTION & SOLAR POWER PROFILE (365 DAYS)</span>
            </div>
            <div className="text-[9px] text-space-400 mt-0.5">
              SIMULATED SPICE-DERIVED ORBITAL PREDICTIONS CONSTRAINED BY EMPIRICAL LROC ALBEDO
            </div>
          </div>
          <span className="text-[10px] text-space-400">10m² VERTICAL ARRAY @ 28% EFF</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={solar_timeline} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day_of_year" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Mission Day of Year (0 - 365)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 10 }} label={{ value: 'Sunlight (%)', angle: -90, position: 'insideLeft', fill: '#f59e0b', fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" tick={{ fontSize: 10 }} label={{ value: 'Power Output (kW)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f293d', fontSize: '11px', fontFamily: 'monospace' }}
                labelFormatter={(lbl: number) => `Mission Day ${lbl}`}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="illumination_pct" name="Illumination Fraction (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="estimated_power_kw" name="Generated Solar Power (kW)" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-space-800 flex justify-between text-[10px] text-space-400">
          <span>Seasonal Elevation Dip: Southern Winter (Day ~180)</span>
          <span>Peak Insolation: Southern Summer Solstice (Day ~350)</span>
        </div>
      </div>

      {/* Two Column: Thermal / PSR Analysis & Battery Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PSR Cold Trap & Thermal Regimes */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="text-space-200 font-semibold flex items-center space-x-2">
              <ThermometerSnowflake className="w-4 h-4 text-blue-400" />
              <span>COLD TRAP & PERMANENT SHADOW CLASSIFICATION</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">REAL DIVINER</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Permanent Shadow Region (PSR):</span>
              <strong className={solar_summary.is_permanent_shadow_region ? 'text-red-400' : 'text-emerald-400'}>
                {solar_summary.is_permanent_shadow_region ? 'YES (TRUE COLD TRAP)' : 'NO (CYCLIC ILLUMINATION)'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Thermal Environment:</span>
              <strong className="text-cyan-300">{solar_summary.thermal_environment}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Volatile Stability Window:</span>
              <strong className="text-space-200">
                {solar_summary.is_permanent_shadow_region ? 'Cryogenic Ice Trap (<110K Stable)' : 'Sublimating / Unstable'}
              </strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Solar Power Verdict:</span>
              <strong className={solar_summary.solar_feasibility_verdict.includes('EXCELLENT') ? 'text-emerald-400' : 'text-amber-400'}>
                {solar_summary.solar_feasibility_verdict}
              </strong>
            </div>
          </div>

          <div className="bg-space-950 p-2.5 rounded border border-space-800 text-[10px] text-space-400 leading-relaxed">
            <strong>Scientific Note:</strong> NASA Diviner radiometer observations indicate regions with &lt;5% sunlight remain perpetually below 90 Kelvin, preserving water ice and complex organic volatiles over billion-year timescales.
          </div>
        </div>

        {/* Battery & Energy Storage Sizing */}
        <div className="bg-space-900 border border-space-700 p-4 rounded-sm shadow-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-space-800">
            <div className="text-space-200 font-semibold flex items-center space-x-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>POWER ARCHITECTURE & STORAGE TRADEOFF</span>
            </div>
            <span className="text-[10px] text-space-400">500W BASELINE LOAD</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Shadow Duration to Bridge:</span>
              <strong className="text-space-200">{solar_summary.longest_consecutive_shadow_hours} continuous hours</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Required Battery Storage:</span>
              <strong className="text-cyan-300">{solar_summary.required_energy_storage_kwh} kWh</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Estimated Li-Ion Mass (150 Wh/kg):</span>
              <strong className="text-space-200">{solar_summary.estimated_battery_mass_kg} kg</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-space-850">
              <span className="text-space-400">Solar Array Sizing:</span>
              <strong className="text-amber-300">
                {site.illumination_annual_pct >= 75 ? 'Standard 2.5m Mast (10 m²)' : 'Heavy 4m Articulated Mast (22 m²)'}
              </strong>
            </div>
          </div>

          <div className="bg-space-950 p-2.5 rounded border border-space-800 text-[10px] text-space-400 leading-relaxed">
            <strong>Engineering Implication:</strong> High peak sites such as Malapert Massif and Peak Near Shackleton cut required battery payload weight by over 80% compared to lower latitude baseline targets.
          </div>
        </div>
      </div>
    </div>
  );
};
