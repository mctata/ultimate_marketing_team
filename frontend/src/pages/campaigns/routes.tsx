import React from 'react';
import { Route, Routes } from 'react-router-dom';

import CampaignList from './CampaignList';
import CampaignEditor from './CampaignEditor';
import CampaignMetrics from './CampaignMetrics';
import AdSetDetail from './AdSetDetail';
import AdEditor from './AdEditor';
import ABTestingDashboard from './ABTestingDashboard';
import CompetitorBenchmark from './CompetitorBenchmark';
import CustomReportsDashboard from './CustomReportsDashboard';
import CampaignPerformanceAlerts from './CampaignPerformanceAlerts';

const CampaignRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CampaignList />} />
      <Route path="/new" element={<CampaignEditor />} />
      <Route path="/:id" element={<CampaignEditor />} />
      <Route path="/:id/metrics" element={<CampaignMetrics />} />
      <Route path="/:id/ab-testing" element={<ABTestingDashboard />} />
      <Route path="/:id/benchmark" element={<CompetitorBenchmark />} />
      <Route path="/:id/alerts" element={<CampaignPerformanceAlerts />} />
      <Route path="/:campaignId/adsets/:adSetId" element={<AdSetDetail />} />
      <Route path="/:campaignId/adsets/:adSetId/ads/new" element={<AdEditor />} />
      <Route path="/:campaignId/adsets/:adSetId/ads/:adId" element={<AdEditor />} />
      <Route path="/reports" element={<CustomReportsDashboard />} />
    </Routes>
  );
};

export default CampaignRoutes;
