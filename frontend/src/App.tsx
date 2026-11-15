import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { MissionOverviewPage } from './pages/MissionOverviewPage';
import { LunarNavigatorPage } from './pages/LunarNavigatorPage';
import { TerrainIntelligencePage } from './pages/TerrainIntelligencePage';
import { IlluminationAnalysisPage } from './pages/IlluminationAnalysisPage';
import { LandingSiteEvaluationPage } from './pages/LandingSiteEvaluationPage';
import { SiteComparisonPage } from './pages/SiteComparisonPage';
import { MissionPlannerPage } from './pages/MissionPlannerPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<MissionOverviewPage />} />
          <Route path="navigator" element={<LunarNavigatorPage />} />
          <Route path="terrain" element={<TerrainIntelligencePage />} />
          <Route path="illumination" element={<IlluminationAnalysisPage />} />
          <Route path="evaluation" element={<LandingSiteEvaluationPage />} />
          <Route path="comparison" element={<SiteComparisonPage />} />
          <Route path="planner" element={<MissionPlannerPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="datasets" element={<DataSourcesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
