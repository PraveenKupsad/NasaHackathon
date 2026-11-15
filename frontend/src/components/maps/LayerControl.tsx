import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';

export interface LayerState {
  surface: boolean;
  elevation: boolean;
  slope: boolean;
  craters: boolean;
  hazards: boolean;
  illumination: boolean;
  sites: boolean;
}

interface LayerControlProps {
  layers: LayerState;
  onToggleLayer: (layerName: keyof LayerState) => void;
}

const layerMeta: Array<{ key: keyof LayerState; label: string; desc: string; source: string; status: 'REAL' | 'SIMULATED' }> = [
  { key: 'surface', label: '1. Surface Imagery', desc: 'LROC NAC / WAC polar relief', source: 'NASA LROC', status: 'REAL' },
  { key: 'elevation', label: '2. Elevation (GDR)', desc: 'LOLA 20m Altimetry contours', source: 'NASA LOLA', status: 'REAL' },
  { key: 'slope', label: '3. Slope Heatmap', desc: 'Gradient tilt classification', source: 'LOLA Derived', status: 'REAL' },
  { key: 'craters', label: '4. Crater Locations', desc: 'IAU polar nomenclature & rims', source: 'IAU / USGS', status: 'REAL' },
  { key: 'hazards', label: '5. Hazard Zones', desc: 'Meter-scale blocks & scarps', source: 'Stochastic Model', status: 'SIMULATED' },
  { key: 'illumination', label: '6. Illumination (PSRs)', desc: 'Permanent shadow vs peaks', source: 'LROC WAC / Diviner', status: 'REAL' },
  { key: 'sites', label: '7. Candidate Sites', desc: '15 Artemis candidate regions', source: 'NASA Artemis / Eng', status: 'REAL' },
];

export const LayerControl: React.FC<LayerControlProps> = ({ layers, onToggleLayer }) => {
  return (
    <div className="bg-space-900 border border-space-700 rounded-sm p-3 font-mono text-xs shadow-panel">
      <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-2.5 pb-1.5 border-b border-space-800">
        <Layers className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wider">Map Layer Stack</span>
      </div>

      <div className="space-y-1.5">
        {layerMeta.map((item) => {
          const isEnabled = layers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => onToggleLayer(item.key)}
              className={`w-full flex items-center justify-between p-1.5 rounded transition text-left ${
                isEnabled
                  ? 'bg-space-800/90 text-space-100 border border-space-700'
                  : 'bg-space-950/50 text-space-400 border border-space-850 hover:bg-space-850'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0">
                {isEnabled ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-space-500 shrink-0" />
                )}
                <div className="truncate">
                  <div className="text-[11px] font-medium leading-none">{item.label}</div>
                  <div className="text-[9px] text-space-400 truncate mt-0.5">{item.desc}</div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0 ml-2">
                <span
                  className={`text-[8px] px-1 py-0.2 rounded font-bold ${
                    item.status === 'REAL'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
