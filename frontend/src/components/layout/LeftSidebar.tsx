import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Mountain,
  Sun,
  ShieldAlert,
  GitCompare,
  Sliders,
  FileText,
  Database,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  Info
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  isPrimary?: boolean;
}

const navItems: NavItem[] = [
  { name: '1. Mission Overview', path: '/', icon: LayoutDashboard },
  { name: '2. Lunar Navigator', path: '/navigator', icon: Compass, isPrimary: true, tag: 'CORE' },
  { name: '3. Terrain Intelligence', path: '/terrain', icon: Mountain },
  { name: '4. Illumination Analysis', path: '/illumination', icon: Sun },
  { name: '5. Landing Site Evaluation', path: '/evaluation', icon: ShieldCheck },
  { name: '6. Site Comparison', path: '/comparison', icon: GitCompare },
  { name: '7. Mission Planner', path: '/planner', icon: Sliders },
  { name: '8. Reports', path: '/reports', icon: FileText },
  { name: '9. Data Sources', path: '/datasets', icon: Database },
  { name: '10. Settings', path: '/settings', icon: Settings },
];

export const LeftSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-space-900 border-r border-space-700 flex flex-col justify-between shrink-0 select-none">
      {/* Navigation List */}
      <div className="py-2 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono text-space-400 uppercase tracking-widest border-b border-space-800/80 mb-1">
          NAVIGATION MODULES
        </div>
        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-sm text-xs font-mono transition-colors duration-150 ${
                    isActive
                      ? 'bg-space-800 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-sm'
                      : 'text-space-300 hover:text-space-100 hover:bg-space-850 border-l-2 border-transparent'
                  } ${item.isPrimary ? 'font-medium' : ''}`
                }
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-space-400" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.tag && (
                  <span className="text-[9px] px-1 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">
                    {item.tag}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Engineering Prototype & CRS Provenance Footer */}
      <div className="p-3 border-t border-space-800 bg-space-950/80 text-[11px] font-mono space-y-2">
        <div className="flex items-start space-x-1.5 text-space-400">
          <Info className="w-3.5 h-3.5 text-space-400 shrink-0 mt-0.5" />
          <p className="leading-tight text-[10px]">
            HACKATHON PROTOTYPE.<br />
            No NASA endorsement or flight certification implied.
          </p>
        </div>
        <div className="pt-1 border-t border-space-850 text-[10px] text-space-400 flex justify-between">
          <span>CRS: EPSG:75400</span>
          <span>SPHERE 1737.4 km</span>
        </div>
      </div>
    </aside>
  );
};
