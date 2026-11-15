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

const API_BASE = 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },

  async getSites(params?: {
    max_slope?: number;
    min_illum?: number;
    max_hazard?: number;
    footprint?: number;
  }): Promise<EvaluationResult[]> {
    const res = await apiClient.get('/sites', { params });
    return res.data;
  },

  async getSiteDetail(siteId: string): Promise<SiteDetail> {
    const res = await apiClient.get(`/sites/${siteId}`);
    return res.data;
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
    const res = await apiClient.post('/analyze', payload);
    return res.data;
  },

  async compareSites(payload: {
    site_ids: string[];
    weights?: Record<string, number>;
    max_slope_deg?: number;
    min_illumination_pct?: number;
    max_hazard_tolerance?: number;
    landing_footprint_m?: number;
  }): Promise<ComparisonResponse> {
    const res = await apiClient.post('/compare', payload);
    return res.data;
  },

  async getMissionOverview(): Promise<MissionOverviewData> {
    const res = await apiClient.get('/analysis/overview');
    return res.data;
  },

  async getCraters(): Promise<Crater[]> {
    const res = await apiClient.get('/craters');
    return res.data;
  },

  async getDatasets(): Promise<Dataset[]> {
    const res = await apiClient.get('/datasets');
    return res.data;
  },

  async configureMission(payload: Partial<MissionConfig>) {
    const res = await apiClient.post('/mission/configure', payload);
    return res.data;
  },

  async getMissionConfigs(): Promise<MissionConfig[]> {
    const res = await apiClient.get('/mission/configs');
    return res.data;
  },

  async getReport(siteId: string) {
    const res = await apiClient.get(`/reports/${siteId}`);
    return res.data;
  },

  getCsvExportUrl() {
    return `${API_BASE}/reports/export/csv`;
  }
};
