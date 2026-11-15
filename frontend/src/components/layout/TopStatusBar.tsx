import React, { useState, useEffect } from 'react';
import { Activity, Database, Satellite, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';

export const TopStatusBar: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(12);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString().replace('T', ' ').substring(0, 22) + ' UTC';
      setUtcTime(iso);
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      const t0 = performance.now();
      try {
        await apiService.getHealth();
        const diff = Math.round(performance.now() - t0);
        setLatencyMs(diff || 8);
        setBackendOnline(true);
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const poll = setInterval(checkHealth, 8000);
    return () => clearInterval(poll);
  }, []);

  return (
    <header className="h-12 bg-space-900 border-b border-space-700 flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-none transform rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="font-bold tracking-wider text-base text-white font-mono">LUNA NAV</span>
        </div>
        <span className="text-space-600">|</span>
        <span className="text-xs text-space-400 font-mono tracking-wide hidden md:inline">
          LUNAR SOUTH POLE LANDING INTELLIGENCE & NAV
        </span>
      </div>

      {/* Telemetry Status Bar */}
      <div className="flex items-center space-x-5 text-xs font-mono">
        {/* Mission ID */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-space-850 px-2.5 py-1 border border-space-750 rounded-sm">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-space-400">MISSION:</span>
          <span className="text-cyan-300 font-semibold">ARTEMIS-III-SPT</span>
        </div>

        {/* Dataset Status */}
        <div className="hidden sm:flex items-center space-x-1.5 bg-space-850 px-2.5 py-1 border border-space-750 rounded-sm">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-space-400">DATA:</span>
          <span className="text-blue-300">6/6 VERIFIED</span>
        </div>

        {/* Analysis Status */}
        <div className="flex items-center space-x-1.5 bg-space-850 px-2.5 py-1 border border-space-750 rounded-sm">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-space-400">STATUS:</span>
          <span className="text-emerald-400 font-semibold tracking-wider">OPERATIONAL</span>
        </div>

        {/* Live UTC Clock */}
        <div className="flex items-center space-x-1.5 text-space-300 bg-space-950 px-2.5 py-1 border border-space-750 rounded-sm font-telemetry">
          <Clock className="w-3.5 h-3.5 text-space-400" />
          <span>{utcTime || '2026-11-15 16:00:00.00 UTC'}</span>
        </div>

        {/* Backend Heartbeat */}
        <div className="flex items-center space-x-1.5 pl-2 border-l border-space-700">
          <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-red-500'}`} />
          <span className={`text-[11px] ${backendOnline ? 'text-space-300' : 'text-red-400 font-bold'}`}>
            {backendOnline ? `FASTAPI ${latencyMs}ms` : 'OFFLINE'}
          </span>
        </div>
      </div>
    </header>
  );
};
