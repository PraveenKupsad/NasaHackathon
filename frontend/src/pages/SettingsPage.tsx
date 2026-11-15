import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Settings,
  CheckCircle,
  Database,
  Sliders,
  Server,
  RefreshCw,
  Info
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [coordFormat, setCoordFormat] = useState<'DD' | 'DMS'>('DD');
  const [elevationUnit, setElevationUnit] = useState<'m' | 'km'>('m');
  const [selectedPreset, setSelectedPreset] = useState<string>('crewed');
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      setTestingConnection(true);
      const data = await apiService.getHealth();
      setBackendStatus(data);
    } catch (err) {
      setBackendStatus({ status: 'OFFLINE', error: 'Failed to contact backend' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-mono text-xs">
      {/* Title */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Workstation Settings & Engineering Presets
            </h1>
          </div>
          <span className="text-[10px] text-space-400 mt-0.5 block">
            Display Units, Coordinate Systems & Mission Telemetry Configurations
          </span>
        </div>

        {savedNotice && (
          <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded text-xs font-bold flex items-center space-x-1 animate-pulse">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      {/* Coordinate & Geodetic Display */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-4">
        <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 uppercase">
          1.0 Coordinate & Elevation Display Units
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-space-400 text-[10px] block mb-1.5">LUNAR COORDINATE NOTATION</label>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-2 p-2 bg-space-850 border border-space-750 rounded cursor-pointer">
                <input
                  type="radio"
                  name="coordFormat"
                  checked={coordFormat === 'DD'}
                  onChange={() => setCoordFormat('DD')}
                  className="accent-cyan-400"
                />
                <span className="text-space-200">Decimal Degrees (e.g., -89.65° S, 123.50° E)</span>
              </label>
              <label className="flex items-center space-x-2 p-2 bg-space-850 border border-space-750 rounded cursor-pointer">
                <input
                  type="radio"
                  name="coordFormat"
                  checked={coordFormat === 'DMS'}
                  onChange={() => setCoordFormat('DMS')}
                  className="accent-cyan-400"
                />
                <span className="text-space-200">Degrees Minutes Seconds (e.g., 89°39′00″ S, 123°30′00″ E)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-space-400 text-[10px] block mb-1.5">ELEVATION DATUM UNIT</label>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-2 p-2 bg-space-850 border border-space-750 rounded cursor-pointer">
                <input
                  type="radio"
                  name="elevationUnit"
                  checked={elevationUnit === 'm'}
                  onChange={() => setElevationUnit('m')}
                  className="accent-cyan-400"
                />
                <span className="text-space-200">Meters above 1737.4 km reference sphere (m)</span>
              </label>
              <label className="flex items-center space-x-2 p-2 bg-space-850 border border-space-750 rounded cursor-pointer">
                <input
                  type="radio"
                  name="elevationUnit"
                  checked={elevationUnit === 'km'}
                  onChange={() => setElevationUnit('km')}
                  className="accent-cyan-400"
                />
                <span className="text-space-200">Kilometers (km)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Weight Presets */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-4">
        <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 uppercase flex items-center justify-between">
          <span>2.0 Operational Evaluation Weight Presets</span>
          <span className="text-[10px] text-space-400 font-normal">PRE-TUNED SCIENTIFIC PROFILE TEMPLATES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'crewed',
              title: 'Crewed Human Lander',
              desc: 'High priority on terrain safety (35%) & slope (35%), strict clearance margin & Earth line of sight.',
              weights: 'Slope 35%, Terrain 35%, Illum 15%, Crater 10%, Access 5%'
            },
            {
              id: 'cargo',
              title: 'Autonomous Cargo Delivery',
              desc: 'Balanced terrain safety and solar persistence for long-duration surface payloads.',
              weights: 'Slope 30%, Terrain 25%, Illum 20%, Crater 15%, Access 10%'
            },
            {
              id: 'rover',
              title: 'Cryo-Volatile Scout Rover',
              desc: 'Prioritizes crater proximity and shadowed cold traps with relaxed slope boundaries.',
              weights: 'Slope 20%, Terrain 20%, Illum 10%, Crater 30%, Access 20%'
            }
          ].map((preset) => (
            <div
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              className={`p-3 rounded border transition cursor-pointer space-y-1.5 ${
                selectedPreset === preset.id
                  ? 'bg-space-800 border-cyan-400 text-white shadow-cyan-glow'
                  : 'bg-space-850 border-space-750 text-space-300 hover:bg-space-800'
              }`}
            >
              <div className="font-bold text-xs">{preset.title}</div>
              <p className="text-[10px] text-space-400 leading-tight">{preset.desc}</p>
              <div className="text-[9px] text-cyan-300 font-telemetry pt-1 border-t border-space-750">
                {preset.weights}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backend API Connection & Diagnostics */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel space-y-3">
        <div className="text-space-200 font-semibold border-b border-space-800 pb-1.5 uppercase flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>3.0 Backend Diagnostics & Endpoint Connectivity</span>
          </div>
          <button
            onClick={checkBackend}
            className="flex items-center space-x-1 px-2 py-0.5 bg-space-800 hover:bg-space-750 border border-space-700 rounded text-[10px] text-cyan-300 transition"
          >
            <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} />
            <span>Ping Server</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-space-950 p-3 rounded border border-space-850">
          <div>
            <span className="text-space-500 text-[10px] block uppercase">STATUS</span>
            <span className={`font-bold ${backendStatus?.status === 'HEALTHY' ? 'text-emerald-400' : 'text-red-400'}`}>
              {backendStatus?.status || 'UNKNOWN'}
            </span>
          </div>
          <div>
            <span className="text-space-500 text-[10px] block uppercase">VERSION</span>
            <span className="text-space-200 font-telemetry">{backendStatus?.version || '1.0.0'}</span>
          </div>
          <div>
            <span className="text-space-500 text-[10px] block uppercase">ENGINE</span>
            <span className="text-space-200">{backendStatus?.backend_engine || 'FastAPI / Python 3.13'}</span>
          </div>
          <div>
            <span className="text-space-500 text-[10px] block uppercase">API BASE</span>
            <span className="text-cyan-300 font-telemetry text-[10px]">{import.meta.env.VITE_API_URL || 'Autonomous Client-Side Engine'}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow transition"
          >
            Apply & Save Workstation Settings
          </button>
        </div>
      </div>
    </div>
  );
};
