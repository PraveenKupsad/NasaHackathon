import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Site, Crater } from '../../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair } from 'lucide-react';

interface LayerState {
  surface: boolean;
  elevation: boolean;
  slope: boolean;
  craters: boolean;
  hazards: boolean;
  illumination: boolean;
  sites: boolean;
}

interface PolarCanvasProps {
  sites: Site[];
  craters: Crater[];
  selectedSite: Site | null;
  selectedSiteIds: string[];
  onSelectSite: (site: Site) => void;
  onToggleMultiSelectSite: (site: Site) => void;
  layers: LayerState;
}

export const PolarCanvas: React.FC<PolarCanvasProps> = ({
  sites,
  craters,
  selectedSite,
  selectedSiteIds,
  onSelectSite,
  onToggleMultiSelectSite,
  layers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pan and zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; distKm: number } | null>(null);

  // Convert Lunar Polar Coordinates (Lat <= -80, Lon in [0, 360]) to Canvas (X, Y)
  // EPSG:75400 Lunar Polar Stereographic projection approximation:
  // Center: 90°S (r = 0)
  // Distance from pole is (90 - abs(lat))
  // 1 degree of latitude on Moon = ~30.32 km (Moon Radius = 1737.4 km)
  const polarToCanvas = useCallback(
    (lat: number, lon: number, width: number, height: number, currentZoom: number, currentPan: { x: number; y: number }) => {
      const cx = width / 2 + currentPan.x;
      const cy = height / 2 + currentPan.y;
      
      // Base scale: 10 degrees (80°S to 90°S) maps to min(width, height) * 0.44
      const baseRadius = (Math.min(width, height) * 0.44) / 10.0;
      const degFromPole = Math.max(0, 90.0 - Math.abs(lat));
      const r = degFromPole * baseRadius * currentZoom;
      
      // Angle: 0° Lon (Earth-facing / Prime Meridian) points straight UP (-90 deg in screen space)
      const rad = ((lon - 90) * Math.PI) / 180.0;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);

      return { x, y, r, baseRadius };
    },
    []
  );

  // Convert Screen (X, Y) back to Lunar Coordinates (Lat, Lon)
  const canvasToPolar = useCallback(
    (screenX: number, screenY: number, width: number, height: number, currentZoom: number, currentPan: { x: number; y: number }) => {
      const cx = width / 2 + currentPan.x;
      const cy = height / 2 + currentPan.y;
      const dx = screenX - cx;
      const dy = screenY - cy;
      const distPx = Math.sqrt(dx * dx + dy * dy);

      const baseRadius = (Math.min(width, height) * 0.44) / 10.0;
      const degFromPole = distPx / (baseRadius * currentZoom);
      const lat = -(90.0 - degFromPole);

      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180.0) / Math.PI + 90.0;
      if (deg < 0) deg += 360.0;
      if (deg >= 360.0) deg -= 360.0;

      const distKm = degFromPole * 30.32;

      return { lat: Number(lat.toFixed(2)), lon: Number(deg.toFixed(2)), distKm: Number(distKm.toFixed(1)) };
    },
    []
  );

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2 + pan.x;
    const cy = height / 2 + pan.y;
    const baseRadius = (Math.min(width, height) * 0.44) / 10.0;

    // --- 1. BASE SPACE BACKGROUND & POLAR DISC ---
    ctx.fillStyle = '#070b13';
    ctx.fillRect(0, 0, width, height);

    // Outer boundary (80°S) clip/glow
    const rOuter = 10.0 * baseRadius * zoom;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rOuter);
    grad.addColorStop(0, '#111824');
    grad.addColorStop(0.75, '#0d131d');
    grad.addColorStop(1, '#080d16');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.fill();

    // --- LAYER 1: LUNAR SURFACE IMAGERY & RELIEF TEXTURE ---
    if (layers.surface) {
      // Draw procedural high-fidelity shaded polar texture
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.clip();

      // Regolith noise bands
      const rings = [2, 4, 6, 8, 10];
      for (const ringDeg of rings) {
        const ringR = ringDeg * baseRadius * zoom;
        ctx.strokeStyle = '#182438';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Macro highlands / maria shaded relief shading
      const lightRad = ((-45) * Math.PI) / 180.0; // Simulated low grazing sun
      const reliefGrad = ctx.createLinearGradient(
        cx + rOuter * Math.cos(lightRad),
        cy + rOuter * Math.sin(lightRad),
        cx - rOuter * Math.cos(lightRad),
        cy - rOuter * Math.sin(lightRad)
      );
      reliefGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      reliefGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
      reliefGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = reliefGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- LAYER 2: ELEVATION CONTOURS (LOLA GDR HYPSOMETRY) ---
    if (layers.elevation) {
      ctx.save();
      // Draw subtle elevation tint halos around craters and massifs
      // Malapert Massif high peak (2480m)
      const malaPos = polarToCanvas(-85.8, 2.8, width, height, zoom, pan);
      const malaGrad = ctx.createRadialGradient(malaPos.x, malaPos.y, 2, malaPos.x, malaPos.y, 38 * zoom);
      malaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)'); // High elevation amber
      malaGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
      malaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = malaGrad;
      ctx.beginPath();
      ctx.arc(malaPos.x, malaPos.y, 38 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Shackleton Rim Peak (+1450m)
      const shakPos = polarToCanvas(-89.67, 129.78, width, height, zoom, pan);
      const shakGrad = ctx.createRadialGradient(shakPos.x, shakPos.y, 1, shakPos.x, shakPos.y, 18 * zoom);
      shakGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      shakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shakGrad;
      ctx.beginPath();
      ctx.arc(shakPos.x, shakPos.y, 18 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Deep crater floors (-4000m depression cyan/indigo)
      const shoePos = polarToCanvas(-88.04, 45.42, width, height, zoom, pan);
      const shoeGrad = ctx.createRadialGradient(shoePos.x, shoePos.y, 2, shoePos.x, shoePos.y, 25 * zoom);
      shoeGrad.addColorStop(0, 'rgba(30, 58, 138, 0.6)'); // Deep basin floor
      shoeGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.2)');
      shoeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shoeGrad;
      ctx.beginPath();
      ctx.arc(shoePos.x, shoePos.y, 25 * zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // --- LAYER 3: SLOPE HEATMAP OVERLAYS ---
    if (layers.slope) {
      ctx.save();
      // Render slope gradient rings around crater rims
      craters.forEach((crater) => {
        const pos = polarToCanvas(crater.lat, crater.lon, width, height, zoom, pan);
        const radiusPx = ((crater.diameter_km / 2.0) / 30.32) * baseRadius * zoom;
        if (radiusPx < 2) return;

        // Crater wall steep slope (>15° Red/Amber band)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = Math.max(1.5, 3 * zoom);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        ctx.stroke();

        // Benign floor (<5° green)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // --- LAYER 6: ILLUMINATION REGIONS (PSRs vs HIGH SUNLIGHT PEAKS) ---
    if (layers.illumination) {
      ctx.save();
      // Permanently Shadowed Regions (PSRs in deep cold blue/black)
      craters.filter(c => c.psr).forEach((crater) => {
        const pos = polarToCanvas(crater.lat, crater.lon, width, height, zoom, pan);
        const radiusPx = ((crater.diameter_km / 2.0) / 30.32) * baseRadius * zoom * 0.75;
        if (radiusPx < 2) return;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; // Cryo cold trap
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // High illumination ridgelines (Shackleton Peak, Malapert Massif, Connecting Ridge)
      const peakSites = sites.filter(s => s.illumination_annual_pct >= 80.0);
      peakSites.forEach(s => {
        const pos = polarToCanvas(s.lat, s.lon, width, height, zoom, pan);
        const glow = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 14 * zoom);
        glow.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
        glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14 * zoom, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // --- LAYER 5: HAZARD ZONES (BOULDERS & SCARPS) ---
    if (layers.hazards) {
      ctx.save();
      sites.filter(s => s.hazard_density >= 0.4 || s.slope_mean_deg >= 10.0).forEach(s => {
        const pos = polarToCanvas(s.lat, s.lon, width, height, zoom, pan);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.lineWidth = 1.5;
        const hazardR = 12 * zoom;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, hazardR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Cross pattern inside critical hazard
        ctx.beginPath();
        ctx.moveTo(pos.x - hazardR * 0.7, pos.y - hazardR * 0.7);
        ctx.lineTo(pos.x + hazardR * 0.7, pos.y + hazardR * 0.7);
        ctx.moveTo(pos.x + hazardR * 0.7, pos.y - hazardR * 0.7);
        ctx.lineTo(pos.x - hazardR * 0.7, pos.y + hazardR * 0.7);
        ctx.stroke();
      });
      ctx.restore();
    }

    // --- LAYER 4: CRATER LOCATIONS & LABELS ---
    if (layers.craters) {
      ctx.save();
      craters.forEach((crater) => {
        const pos = polarToCanvas(crater.lat, crater.lon, width, height, zoom, pan);
        const radiusPx = ((crater.diameter_km / 2.0) / 30.32) * baseRadius * zoom;

        // Rim circle
        ctx.strokeStyle = crater.psr ? '#38bdf8' : '#64748b';
        ctx.lineWidth = crater.name === 'Shackleton' ? 2 : 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(3, radiusPx), 0, Math.PI * 2);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = crater.psr ? '#38bdf8' : '#94a3b8';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Label
        if (zoom >= 0.85 || crater.diameter_km > 30 || crater.name === 'Shackleton') {
          ctx.fillStyle = crater.name === 'Shackleton' ? '#22d3ee' : '#cbd5e1';
          ctx.font = `${Math.max(10, Math.round(11 * Math.min(1.4, zoom)))}px "IBM Plex Mono", monospace`;
          ctx.fillText(crater.name.toUpperCase(), pos.x + Math.max(4, radiusPx) + 3, pos.y + 3);
          
          if (zoom >= 1.2) {
            ctx.fillStyle = '#64748b';
            ctx.font = '9px "IBM Plex Mono", monospace';
            ctx.fillText(`Ø ${crater.diameter_km}km`, pos.x + Math.max(4, radiusPx) + 3, pos.y + 13);
          }
        }
      });
      ctx.restore();
    }

    // --- POLAR COORDINATE GRID (LAT RINGS & RADIAL SPOKES) ---
    ctx.save();
    // Latitude concentric circles: 88°S, 86°S, 84°S, 82°S, 80°S
    const latRings = [
      { deg: 88, lat: -88 },
      { deg: 86, lat: -86 },
      { deg: 84, lat: -84 },
      { deg: 82, lat: -82 },
      { deg: 80, lat: -80 },
    ];

    latRings.forEach(ring => {
      const ringR = (90 - ring.deg) * baseRadius * zoom;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Latitude label on Prime Meridian axis
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText(`${ring.deg}°S`, cx + 4, cy - ringR - 3);
    });
    ctx.setLineDash([]);

    // Radial longitude spokes every 45 degrees
    const lonAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    lonAngles.forEach(lon => {
      const rad = ((lon - 90) * Math.PI) / 180.0;
      const xOuter = cx + rOuter * Math.cos(rad);
      const yOuter = cy + rOuter * Math.sin(rad);

      ctx.strokeStyle = lon === 0 ? '#0ea5e9' : '#1e293b';
      ctx.lineWidth = lon === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xOuter, yOuter);
      ctx.stroke();

      // Longitude labels on periphery
      const labelR = rOuter + 14;
      const lx = cx + labelR * Math.cos(rad);
      const ly = cy + labelR * Math.sin(rad);
      ctx.fillStyle = lon === 0 ? '#38bdf8' : '#94a3b8';
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = lon === 0 ? '0° (EARTH)' : lon === 90 ? '90°E' : lon === 180 ? '180°' : lon === 270 ? '90°W' : `${lon}°`;
      ctx.fillText(label, lx, ly);
    });

    // South Pole Rotational Axis Marker
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 10px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('90.0°S POLE', cx + 10, cy - 8);

    ctx.restore();

    // --- LAYER 7: CANDIDATE LANDING SITES ---
    if (layers.sites) {
      ctx.save();
      sites.forEach((site) => {
        const pos = polarToCanvas(site.lat, site.lon, width, height, zoom, pan);
        const isSelected = selectedSite?.id === site.id;
        const isMultiSelected = selectedSiteIds.includes(site.id);
        const isExcluded = site.slope_mean_deg > 10.0 || site.hazard_density > 0.5 || site.illumination_annual_pct < 5.0;

        // Color coding based on status
        let fillColor = '#10b981'; // Nominal Green
        if (isExcluded) fillColor = '#ef4444'; // Red Disqualified
        else if (site.slope_mean_deg > 6.0 || site.illumination_annual_pct < 70.0) fillColor = '#f59e0b'; // Amber Caution

        // Multi-select or Selected outer target ring
        if (isSelected || isMultiSelected) {
          ctx.strokeStyle = isSelected ? '#00e5ff' : '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 12 * Math.min(1.5, zoom), 0, Math.PI * 2);
          ctx.stroke();

          // Selection crosshair tick marks
          ctx.beginPath();
          ctx.moveTo(pos.x - 16, pos.y);
          ctx.lineTo(pos.x - 10, pos.y);
          ctx.moveTo(pos.x + 10, pos.y);
          ctx.lineTo(pos.x + 16, pos.y);
          ctx.moveTo(pos.x, pos.y - 16);
          ctx.lineTo(pos.x, pos.y - 10);
          ctx.moveTo(pos.x, pos.y + 10);
          ctx.lineTo(pos.x, pos.y + 16);
          ctx.stroke();
        }

        // Diamond site symbol
        const s = 6 * Math.min(1.3, zoom);
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - s);
        ctx.lineTo(pos.x + s, pos.y);
        ctx.lineTo(pos.x, pos.y + s);
        ctx.lineTo(pos.x - s, pos.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Site Code Label
        ctx.fillStyle = isSelected ? '#00e5ff' : '#f1f5f9';
        ctx.font = `${isSelected ? 'bold ' : ''}10px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(site.code, pos.x + 9, pos.y + 3);

        if (zoom >= 1.1) {
          ctx.fillStyle = isExcluded ? '#f87171' : '#94a3b8';
          ctx.font = '9px "IBM Plex Mono", monospace';
          ctx.fillText(isExcluded ? 'EXCLUDED' : `${site.illumination_annual_pct}% SUN`, pos.x + 9, pos.y + 13);
        }
      });
      ctx.restore();
    }

    ctx.restore();
  }, [sites, craters, selectedSite, selectedSiteIds, layers, zoom, pan, polarToCanvas]);

  // Mouse handlers for Pan and Zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update real-time polar coordinates under cursor
    const coords = canvasToPolar(mouseX, mouseY, rect.width, rect.height, zoom, pan);
    setCursorCoords(coords);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.6, Math.min(6.0, prev * factor)));
  };

  // Click to select candidate site
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check hit radius on candidate sites
    for (const site of sites) {
      const pos = polarToCanvas(site.lat, site.lon, rect.width, rect.height, zoom, pan);
      const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
      if (dist <= 16) {
        if (e.shiftKey) {
          onToggleMultiSelectSite(site);
        } else {
          onSelectSite(site);
        }
        return;
      }
    }
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full bg-space-950 flex flex-col overflow-hidden select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />

      {/* Floating Coordinate Telemetry HUD (Bottom Left) */}
      <div className="absolute bottom-3 left-3 bg-space-900/90 border border-space-700/80 px-3 py-1.5 rounded text-xs font-mono backdrop-blur-sm shadow-md flex items-center space-x-4 pointer-events-none">
        <div className="flex items-center space-x-1 text-cyan-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="text-[10px] text-space-400">CURSOR:</span>
        </div>
        {cursorCoords ? (
          <>
            <span className="text-space-200">
              LAT: <strong className="text-cyan-300">{cursorCoords.lat.toFixed(2)}° S</strong>
            </span>
            <span className="text-space-200">
              LON: <strong className="text-cyan-300">{cursorCoords.lon.toFixed(2)}° E</strong>
            </span>
            <span className="text-space-400 text-[11px]">
              DIST TO POLE: <strong className="text-space-200">{cursorCoords.distKm} km</strong>
            </span>
          </>
        ) : (
          <span className="text-space-400 text-xs">ACQUIRING GEODETIC LOCK</span>
        )}
      </div>

      {/* Map Control Buttons (Top Right) */}
      <div className="absolute top-3 right-3 flex flex-col space-y-1 z-20">
        <button
          onClick={() => setZoom((z) => Math.min(6.0, z * 1.25))}
          className="p-2 bg-space-900/90 hover:bg-space-800 border border-space-700 text-space-200 hover:text-cyan-300 rounded shadow transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z * 0.8))}
          className="p-2 bg-space-900/90 hover:bg-space-800 border border-space-700 text-space-200 hover:text-cyan-300 rounded shadow transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-space-900/90 hover:bg-space-800 border border-space-700 text-space-200 hover:text-cyan-300 rounded shadow transition"
          title="Reset View to Pole"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Geodetic Reference Pill (Top Left) */}
      <div className="absolute top-3 left-3 bg-space-900/90 border border-space-700 px-2.5 py-1 rounded text-[11px] font-mono text-space-300 pointer-events-none backdrop-blur-sm">
        PROJECTION: <span className="text-cyan-300 font-semibold">IAU MOON 2000 POLAR STEREOGRAPHIC (EPSG:75400)</span>
      </div>
    </div>
  );
};
