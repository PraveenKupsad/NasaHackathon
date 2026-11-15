import axios from 'axios';
import {
  EvaluationResult,
  SiteDetail,
  MissionOverviewData,
  ComparisonResponse,
  Crater,
  Dataset,
  MissionConfig
} from '../types';
import { LunarEngine, CRATERS, DATASETS } from './lunarEngine';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE =
  import.meta.env.VITE_API_URL || (isLocalhost ? 'http://127.0.0.1:8000/api' : '');

export const apiClient = axios.create({
  baseURL: API_BASE || undefined,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isBackendAvailable: boolean | null = null;

export const apiService = {
  getApiBase() {
    return API_BASE || 'Autonomous Lunar Engine (Client-Side Standalone)';
  },

  async getHealth() {
    if (API_BASE) {
      try {
        const res = await apiClient.get('/health');
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return {
      status: 'HEALTHY',
      service: 'LUNA NAV',
      full_title: 'Lunar South Pole Landing Site Intelligence and Navigation System',
      version: '1.0.0-live',
      crs: 'Lunar Polar Stereographic (EPSG:75400 / IAU Moon 2000)',
      backend_engine: isBackendAvailable
        ? 'Python 3.13 / FastAPI'
        : 'Autonomous Lunar Science Engine (Real-Time Client-Side)'
    };
  },

  async getSites(params?: {
    max_slope?: number;
    min_illum?: number;
    max_hazard?: number;
    footprint?: number;
  }): Promise<EvaluationResult[]> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get('/sites', { params });
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.getSites(params);
  },

  async getSiteDetail(siteId: string): Promise<SiteDetail> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get(`/sites/${siteId}`);
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.getSiteDetail(siteId);
  },

  async analyzeSites(payload: {
    site_ids?: string[];
    weights?: Record<string, number>;
    max_slope_deg?: number;
    min_illumination_pct?: number;
    max_hazard_tolerance?: number;
    landing_footprint_m?: number;
    require_earth_los?: boolean;
  }): Promise<EvaluationResult[]> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.post('/analyze', payload);
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.analyzeSites(payload);
  },

  async compareSites(payload: {
    site_ids: string[];
    weights?: Record<string, number>;
    max_slope_deg?: number;
    min_illumination_pct?: number;
    max_hazard_tolerance?: number;
    landing_footprint_m?: number;
  }): Promise<ComparisonResponse> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.post('/compare', payload);
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.compareSites(payload);
  },

  async getMissionOverview(): Promise<MissionOverviewData> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get('/analysis/overview');
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.getMissionOverview();
  },

  async getCraters(): Promise<Crater[]> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get('/craters');
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return CRATERS;
  },

  async getDatasets(): Promise<Dataset[]> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get('/datasets');
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return DATASETS;
  },

  async configureMission(payload: Partial<MissionConfig>): Promise<MissionConfig> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.post('/mission/configure', payload);
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.configureMission(payload);
  },

  async getMissionConfigs(): Promise<MissionConfig[]> {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get('/mission/configs');
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.getMissionConfigs();
  },

  async getReport(siteId: string) {
    if (API_BASE && isBackendAvailable !== false) {
      try {
        const res = await apiClient.get(`/reports/${siteId}`);
        isBackendAvailable = true;
        return res.data;
      } catch (err) {
        isBackendAvailable = false;
      }
    }
    return LunarEngine.getReport(siteId);
  },

  getCsvExportUrl() {
    const csvContent = LunarEngine.generateCsvExportString();
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  }
};
