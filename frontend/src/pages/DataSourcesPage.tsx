import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Dataset } from '../types';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DataSourcesPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const list = await apiService.getDatasets();
        setDatasets(list);
      } catch (err) {
        console.error('Failed to load datasets', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-xs text-cyan-400">
        <Activity className="w-5 h-5 animate-spin mr-2" />
        LOADING DATA CATALOGS & GEODETIC METADATA...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-mono text-xs">
      {/* Page Title */}
      <div className="bg-space-900 border border-space-700 rounded-sm p-4 shadow-panel">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            Scientific Datasets & Provenance Registry
          </h1>
        </div>
        <span className="text-[10px] text-space-400 mt-0.5 block">
          Transparent Accounting of Real NASA Planetary Data Products and Demonstration Synthetic Pipelines
        </span>
      </div>

      {/* Official Research Repositories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a
          href="https://pds-geosciences.wustl.edu/"
          target="_blank"
          rel="noreferrer"
          className="bg-space-900 border border-space-700 hover:border-cyan-500 p-3 rounded-sm shadow-panel transition block space-y-1"
        >
          <div className="flex items-center justify-between text-white font-bold">
            <span>NASA PDS Geosciences</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-[10px] text-space-400">
            Primary orbital laser altimetry, radiometric, and gravity science archives.
          </p>
        </a>

        <a
          href="https://trek.nasa.gov/moon/"
          target="_blank"
          rel="noreferrer"
          className="bg-space-900 border border-space-700 hover:border-cyan-500 p-3 rounded-sm shadow-panel transition block space-y-1"
        >
          <div className="flex items-center justify-between text-white font-bold">
            <span>NASA Moon Trek</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-[10px] text-space-400">
            Interactive polar GIS portals, high-resolution NAC imagery & LOLA shaded relief.
          </p>
        </a>

        <a
          href="https://science.nasa.gov/moon/"
          target="_blank"
          rel="noreferrer"
          className="bg-space-900 border border-space-700 hover:border-cyan-500 p-3 rounded-sm shadow-panel transition block space-y-1"
        >
          <div className="flex items-center justify-between text-white font-bold">
            <span>NASA Moon Science</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-[10px] text-space-400">
            Artemis landing candidate region scientific research and illumination goals.
          </p>
        </a>
      </div>

      {/* Datasets Catalog Table */}
      <div className="space-y-4">
        {datasets.map((ds) => {
          const isReal = ds.status === 'REAL';
          return (
            <div
              key={ds.id}
              className={`bg-space-900 border rounded-sm p-4 shadow-panel space-y-3 ${
                isReal ? 'border-space-700' : 'border-amber-800/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 border-b border-space-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-bold text-white">{ds.name}</h2>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        isReal
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {ds.status} DATASET
                    </span>
                  </div>
                  <div className="text-[10px] text-space-400 mt-0.5">{ds.source}</div>
                </div>

                {ds.url && !ds.url.startsWith('internal://') && (
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs"
                  >
                    <span>PDS Source Record</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-space-950 p-2.5 rounded border border-space-850 text-[11px]">
                <div>
                  <span className="text-space-500 text-[10px] block uppercase">DATA TYPE</span>
                  <span className="text-space-200">{ds.data_type}</span>
                </div>
                <div>
                  <span className="text-space-500 text-[10px] block uppercase">COORDINATE REFERENCE SYSTEM</span>
                  <span className="text-cyan-300 font-telemetry">{ds.crs}</span>
                </div>
                <div>
                  <span className="text-space-500 text-[10px] block uppercase">SPATIAL RESOLUTION</span>
                  <span className="text-space-200">{ds.resolution}</span>
                </div>
              </div>

              {/* Acquisition / Model Information */}
              <div className="space-y-1 text-[11px]">
                <span className="text-space-400 font-semibold block uppercase">Acquisition & Methodology</span>
                <p className="text-space-300 leading-relaxed">{ds.acquisition_info}</p>
              </div>

              {/* Academic Citation & Notes */}
              <div className="pt-2 border-t border-space-850 text-[10px] text-space-400 flex flex-col md:flex-row justify-between gap-1">
                <span className="italic">{ds.citation}</span>
                <span className="text-space-300">{ds.notes}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
