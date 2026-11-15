import React from 'react';
import { HelpCircle } from 'lucide-react';

export const MapLegend: React.FC = () => {
  return (
    <div className="bg-space-900 border border-space-700 rounded-sm p-3 font-mono text-[11px] shadow-panel space-y-2">
      <div className="flex items-center space-x-1.5 text-space-300 font-semibold pb-1.5 border-b border-space-800">
        <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] uppercase tracking-wider">Cartographic Legend</span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-space-300">
        {/* Candidate Sites */}
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-400 transform rotate-45 shrink-0" />
          <span>Prime Nominal (&gt;80)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-amber-400 transform rotate-45 shrink-0" />
          <span>Caution (65-80)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-red-500 transform rotate-45 shrink-0" />
          <span>Disqualified Site</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 border-2 border-cyan-400 rounded-full shrink-0" />
          <span>Selected Target</span>
        </div>

        {/* Craters & Illumination */}
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-slate-950 shrink-0" />
          <span>Permanently Shadowed (PSR)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.6)] shrink-0" />
          <span>High Illumination Ridge</span>
        </div>

        {/* Hazard & Slopes */}
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-1 bg-red-500 shrink-0" />
          <span>Steep Slope (&gt;10°)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 border border-red-500 bg-red-950/40 shrink-0" />
          <span>Hazard Cluster / Scarp</span>
        </div>
      </div>

      <div className="pt-1.5 border-t border-space-800 text-[9px] text-space-400 flex justify-between">
        <span>Prime Meridian: 0° Up (Earth)</span>
        <span>Resolution: 20m - 100m</span>
      </div>
    </div>
  );
};
