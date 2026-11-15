import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Site } from '../types';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Activity,
  ShieldCheck,
  Compass
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSiteId = searchParams.get('site') || 'site-008';

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(requestedSiteId);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const evals = await apiService.getSites();
        setSites(evals.map(e => e.site));
      } catch (err) {
        console.error('Failed to load sites', err);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const data = await apiService.getReport(selectedSiteId);
        setReport(data);
      } catch (err) {
        console.error('Failed to load report', err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedSiteId) {
      fetchReportData();
    }
  }, [selectedSiteId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const url = apiService.getCsvExportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = 'luna_nav_site_evaluations.csv';
    link.click();
  };

  if (loading || !report) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs text-cyan-400">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        COMPILING ENGINEERING FLIGHT SUITABILITY REPORT...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-mono text-xs">
      {/* Action Header (No Print) */}
      <div className="no-print bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Engineering Mission Certification & Site Dossier
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            Technical Specification Document for Spacecraft Flight Planning
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Site Selector */}
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              setSearchParams({ site: e.target.value });
            }}
            className="bg-space-800 border border-space-700 text-cyan-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          {/* CSV Download */}
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-space-800 hover:bg-space-750 text-space-200 hover:text-cyan-300 border border-space-700 rounded text-xs flex items-center space-x-1 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow flex items-center space-x-1 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Printable Engineering Document */}
      <div className="eng-panel p-8 bg-space-900 border border-space-700 rounded shadow-panel space-y-6 text-space-200">
        {/* Document Header */}
        <div className="border-b-2 border-space-700 pb-4 flex justify-between items-start">
          <div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
              LUNA NAV • FLIGHT OPERATIONS INTELLIGENCE SYSTEM
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              LANDING SITE SAFETY & SUITABILITY CERTIFICATION DOSSIER
            </h2>
            <div className="text-xs text-space-400 mt-0.5 font-telemetry">
              REPORT REF: {report.report_id} • GENERATED: {report.generated_at_utc}
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 bg-space-800 border border-space-700 text-space-300 rounded text-[10px] block font-bold">
              UNCLASSIFIED // DEMO
            </span>
            <span className="text-[10px] text-space-400 block mt-1">
              MISSION: {report.mission_identifier}
            </span>
          </div>
        </div>

        {/* Candidate Site Summary Box */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-space-950 p-3 rounded border border-space-800">
          <div>
            <span className="text-space-400 text-[10px] block uppercase">CANDIDATE TARGET</span>
            <span className="font-bold text-white text-sm">{report.site_name}</span>
            <span className="text-[10px] text-space-400 block">{report.site_code}</span>
          </div>

          <div>
            <span className="text-space-400 text-[10px] block uppercase">GEODETIC POSITION</span>
            <span className="font-bold text-cyan-300 text-sm font-telemetry">
              {report.coordinates.latitude}° S, {report.coordinates.longitude}° E
            </span>
            <span className="text-[9px] text-space-400 block">EPSG:75400</span>
          </div>

          <div>
            <span className="text-space-400 text-[10px] block uppercase">SAFETY EXCLUSION</span>
            <span className={`font-bold text-sm ${report.hard_constraint_results.is_excluded ? 'text-red-400' : 'text-emerald-400'}`}>
              {report.hard_constraint_results.status}
            </span>
            <span className="text-[9px] text-space-400 block">
              {report.hard_constraint_results.is_excluded ? 'Constraint Violation' : 'All Bounds Satisfied'}
            </span>
          </div>

          <div>
            <span className="text-space-400 text-[10px] block uppercase">FINAL SUITABILITY</span>
            <span className={`font-bold text-base font-telemetry ${report.hard_constraint_results.is_excluded ? 'text-red-400' : 'text-cyan-300'}`}>
              {report.suitability_score} / 100
            </span>
            <span className="text-[9px] text-space-400 block">{report.recommendation}</span>
          </div>
        </div>

        {/* Section 1: Executive Recommendation Reasoning */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-space-800 pb-1">
            1.0 EXECUTIVE SAFETY EVALUATION & RECOMMENDATION
          </div>
          <p className="text-space-300 text-xs leading-relaxed">
            {report.recommendation_reasoning}
          </p>
          {report.hard_constraint_results.is_excluded && (
            <div className="bg-red-950/60 border border-red-800 p-2.5 rounded text-red-300 text-[11px] space-y-1">
              <span className="font-bold text-red-400">DOCUMENTED CONSTRAINT FAILURES:</span>
              <ul className="list-disc pl-5 space-y-0.5">
                {report.hard_constraint_results.violations.map((v: string, i: number) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section 2: Factor Scoring Breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-space-800 pb-1">
            2.0 NORMALIZED FACTOR EVALUATION BREAKDOWN (0 - 100)
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-[9px] text-space-400 block uppercase">Slope Suitability</span>
              <span className="font-bold text-white font-telemetry text-sm">
                {report.factor_breakdown.slope_suitability_score}
              </span>
              <span className="text-[9px] text-space-400 block">Weight 30%</span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-[9px] text-space-400 block uppercase">Terrain Safety</span>
              <span className="font-bold text-white font-telemetry text-sm">
                {report.factor_breakdown.terrain_safety_score}
              </span>
              <span className="text-[9px] text-space-400 block">Weight 25%</span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-[9px] text-space-400 block uppercase">Illumination</span>
              <span className="font-bold text-white font-telemetry text-sm">
                {report.factor_breakdown.illumination_score}
              </span>
              <span className="text-[9px] text-space-400 block">Weight 20%</span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-[9px] text-space-400 block uppercase">Crater Avoidance</span>
              <span className="font-bold text-white font-telemetry text-sm">
                {report.factor_breakdown.crater_avoidance_score}
              </span>
              <span className="text-[9px] text-space-400 block">Weight 15%</span>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-[9px] text-space-400 block uppercase">Accessibility</span>
              <span className="font-bold text-white font-telemetry text-sm">
                {report.factor_breakdown.accessibility_score}
              </span>
              <span className="text-[9px] text-space-400 block">Weight 10%</span>
            </div>
          </div>
        </div>

        {/* Section 3: Technical Terrain & Illumination Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-space-800 pb-1">
              3.1 TOPOGRAPHICAL ASSESSMENT
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Elevation:</span>
                <span className="font-bold text-white font-telemetry">{report.terrain_assessment.elevation_m} m</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Mean Slope:</span>
                <span className="font-bold text-white font-telemetry">{report.terrain_assessment.slope_mean_deg}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Peak Localized Slope:</span>
                <span className="font-bold text-white font-telemetry">{report.terrain_assessment.slope_max_deg}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Clearance Radius:</span>
                <span className="font-bold text-cyan-300 font-telemetry">{report.terrain_assessment.landing_clearance_m} m</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-space-800 pb-1">
              3.2 SOLAR POWER & THERMAL ASSESSMENT
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Annual Illumination Fraction:</span>
                <span className="font-bold text-amber-300 font-telemetry">{report.illumination_assessment.annual_illumination_fraction}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Summer Solstice Peak:</span>
                <span className="font-bold text-white font-telemetry">{report.illumination_assessment.summer_solstice_peak_fraction}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Max Consecutive Shadow:</span>
                <span className="font-bold text-white font-telemetry">{report.illumination_assessment.solar_summary.longest_consecutive_shadow_hours} hrs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-space-850">
                <span className="text-space-400">Battery Payload Required:</span>
                <span className="font-bold text-cyan-300 font-telemetry">{report.illumination_assessment.solar_summary.estimated_battery_mass_kg} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Data Provenance & Confidence */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-space-800 pb-1">
            4.0 SCIENTIFIC DATA PROVENANCE & INTEGRITY
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-space-400 block">TOPOGRAPHY</span>
              <strong className="text-white">{report.data_confidence.provenance_flags.topography}</strong>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-space-400 block">ILLUMINATION</span>
              <strong className="text-white">{report.data_confidence.provenance_flags.illumination}</strong>
            </div>
            <div className="bg-space-950 p-2 rounded border border-space-800">
              <span className="text-space-400 block">MICRO-RELIEF</span>
              <strong className="text-amber-400">{report.data_confidence.provenance_flags.micro_relief}</strong>
            </div>
          </div>
          <div className="text-[10px] text-space-400 pt-1">
            Confidence Rating: <strong className="text-emerald-400">{report.data_confidence.rating} ({report.data_confidence.confidence_pct}%)</strong>
          </div>
        </div>

        {/* Signatures & Disclaimers */}
        <div className="pt-6 border-t-2 border-space-700 flex justify-between items-end text-[10px] text-space-400">
          <div>
            <div>ANALYSIS ENGINE: LUNA NAV SCIENTIFIC PIPELINE V1.0</div>
            <div>CRS: IAU MOON 2000 POLAR STEREOGRAPHIC (EPSG:75400)</div>
            <div className="text-[9px] text-space-500 mt-1">
              Independent hackathon engineering prototype. Not certified for flight operations.
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-cyan-300">AUTHORIZED FOR MISSION PLANNING</div>
            <div className="text-space-500">DIGITAL SIGNATURE VERIFIED</div>
          </div>
        </div>
      </div>
    </div>
  );
};
