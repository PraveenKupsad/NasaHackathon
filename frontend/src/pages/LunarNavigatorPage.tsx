import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PolarCanvas } from '../components/maps/PolarCanvas';
import { LayerControl, LayerState } from '../components/maps/LayerControl';
import { MapLegend } from '../components/maps/MapLegend';
import { apiService } from '../services/api';
import { Site, Crater } from '../types';
import {
  Compass,
  Mountain,
  Sun,
  ShieldAlert,
  GitCompare,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  CheckSquare,
  Square
} from 'lucide-react';

export const LunarNavigatorPage: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Site[]>([]);
  const [craters, setCraters] = useState<Crater[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(['site-008', 'site-002', 'site-004']);
  const [loading, setLoading] = useState<boolean>(true);

  const [layers, setLayers] = useState<LayerState>({
    surface: true,
    elevation: true,
    slope: true,
    craters: true,
    hazards: true,
    illumination: true,
    sites: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [evals, craterData] = await Promise.all([
          apiService.getSites(),
          apiService.getCraters()
        ]);
        const siteList = evals.map(e => e.site);
        setSites(siteList);
        setCraters(craterData);
        if (siteList.length > 0) {
          setSelectedSite(siteList[0]);
        }
      } catch (err) {
        console.error('Failed to load navigator data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleLayer = (layerName: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
  };

  const handleToggleMultiSelectSite = (site: Site) => {
    setSelectedSiteIds(prev =>
      prev.includes(site.id) ? prev.filter(id => id !== site.id) : [...prev, site.id]
    );
  };

  const handleNavigateComparison = () => {
    if (selectedSiteIds.length >= 2) {
      navigate(`/comparison?sites=${selectedSiteIds.join(',')}`);
    }
  };

  const isExcluded = selectedSite
    ? selectedSite.slope_mean_deg > 10.0 || selectedSite.hazard_density > 0.5 || selectedSite.illumination_annual_pct < 5.0
    : false;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Central Map Canvas Area */}
      <div className="flex-1 relative h-full flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-space-950 font-mono text-xs text-cyan-400">
            <Compass className="w-5 h-5 animate-spin mr-2" />
            INITIALIZING LUNAR SOUTH POLE GEODETIC MATRIX...
          </div>
        ) : (
          <PolarCanvas
            sites={sites}
            craters={craters}
            selectedSite={selectedSite}
            selectedSiteIds={selectedSiteIds}
            onSelectSite={handleSelectSite}
            onToggleMultiSelectSite={handleToggleMultiSelectSite}
            layers={layers}
          />
        )}
      </div>

      {/* Right Control & Telemetry Inspection Drawer */}
      <aside className="w-96 bg-space-900 border-l border-space-700 flex flex-col justify-between shrink-0 overflow-y-auto">
        <div className="p-3.5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-space-750">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                Lunar Navigator
              </h2>
            </div>
            <span className="text-[10px] font-mono text-space-400">80°S TO 90°S</span>
          </div>

          {/* Layer Controls */}
          <LayerControl layers={layers} onToggleLayer={handleToggleLayer} />

          {/* Selected Site Telemetry Card */}
          {selectedSite && (
            <div className="bg-space-850 border border-space-700 rounded-sm p-3 font-mono space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] text-space-400">{selectedSite.code} • {selectedSite.region}</div>
                  <div className="text-sm font-bold text-white leading-tight mt-0.5">{selectedSite.name}</div>
                </div>
                <button
                  onClick={() => handleToggleMultiSelectSite(selectedSite)}
                  className="p-1 hover:bg-space-750 rounded text-space-300 hover:text-cyan-300"
                  title="Toggle Compare Selection"
                >
                  {selectedSiteIds.includes(selectedSite.id) ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Square className="w-4 h-4 text-space-500" />
                  )}
                </button>
              </div>

              {/* Exclusion Alert Banner */}
              {isExcluded ? (
                <div className="bg-red-950/60 border border-red-800 text-red-300 px-2 py-1.5 rounded text-[11px] flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>DISQUALIFIED: Exceeds mandatory safety limits</span>
                </div>
              ) : (
                <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 px-2 py-1.5 rounded text-[11px] flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>PASSES ALL MANDATORY SAFETY CONSTRAINTS</span>
                </div>
              )}

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-space-950/80 p-2 rounded border border-space-800">
                <div>
                  <span className="text-[10px] text-space-400 block">LATITUDE</span>
                  <span className="font-bold text-cyan-300">{selectedSite.lat.toFixed(2)}° S</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 block">LONGITUDE</span>
                  <span className="font-bold text-cyan-300">{selectedSite.lon.toFixed(2)}° E</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 block">ELEVATION (LOLA)</span>
                  <span className="font-bold text-space-200">{selectedSite.elevation_m.toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 block">MEAN / MAX SLOPE</span>
                  <span className={`font-bold ${selectedSite.slope_mean_deg > 8 ? 'text-amber-400' : 'text-space-200'}`}>
                    {selectedSite.slope_mean_deg}° / {selectedSite.slope_max_deg}°
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 block">ANNUAL SUNLIGHT</span>
                  <span className="font-bold text-amber-300">{selectedSite.illumination_annual_pct}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-400 block">CLEARANCE RADIUS</span>
                  <span className="font-bold text-space-200">{selectedSite.landing_clearance_m} m</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-space-300 leading-relaxed bg-space-900/50 p-2 rounded border border-space-800/60">
                {selectedSite.description}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <button
                  onClick={() => navigate(`/terrain?site=${selectedSite.id}`)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-cyan-300 rounded transition"
                >
                  <Mountain className="w-3.5 h-3.5" />
                  <span>Terrain</span>
                </button>
                <button
                  onClick={() => navigate(`/illumination?site=${selectedSite.id}`)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-cyan-300 rounded transition"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Illumination</span>
                </button>
                <button
                  onClick={() => navigate(`/evaluation?site=${selectedSite.id}`)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-cyan-300 rounded transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Evaluate</span>
                </button>
                <button
                  onClick={() => navigate(`/reports?site=${selectedSite.id}`)}
                  className="flex items-center justify-center space-x-1 px-2 py-1.5 bg-space-800 hover:bg-space-750 border border-space-700 text-space-200 hover:text-cyan-300 rounded transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          )}

          {/* Multi-Site Comparison Basket */}
          <div className="bg-space-850 border border-space-700 rounded-sm p-3 font-mono space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-space-300 font-semibold flex items-center space-x-1">
                <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                <span>COMPARE BASKET ({selectedSiteIds.length})</span>
              </span>
              {selectedSiteIds.length > 0 && (
                <button
                  onClick={() => setSelectedSiteIds([])}
                  className="text-[10px] text-space-500 hover:text-space-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-[11px] text-space-400">
              {selectedSiteIds.length === 0 ? (
                <span>No sites selected. Click markers or checkboxes to add candidates for comparison.</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedSiteIds.map(id => {
                    const match = sites.find(s => s.id === id);
                    return (
                      <span key={id} className="px-1.5 py-0.5 bg-space-800 border border-space-700 text-cyan-300 rounded text-[10px]">
                        {match?.code || id}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleNavigateComparison}
              disabled={selectedSiteIds.length < 2}
              className={`w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                selectedSiteIds.length >= 2
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow'
                  : 'bg-space-800 text-space-500 cursor-not-allowed border border-space-750'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Launch Site Comparison</span>
            </button>
          </div>

          {/* Cartographic Legend */}
          <MapLegend />
        </div>
      </aside>
    </div>
  );
};
