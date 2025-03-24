import React from 'react';
import { Route, Routes } from 'react-router-dom';

import CampaignList from './CampaignList';
import CampaignEditor from './CampaignEditor';
import CampaignMetrics from './CampaignMetrics';
import AdSetDetail from './AdSetDetail';
import AdEditor from './AdEditor';
import ABTestingDashboard from './ABTestingDashboard';

const CampaignRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<CampaignList />} />
      <Route path="/new" element={<CampaignEditor />} />
      <Route path="/:id" element={<CampaignEditor />} />
      <Route path="/:id/metrics" element={<CampaignMetrics />} />
      <Route path="/:id/ab-testing" element={<ABTestingDashboard />} />
      <Route path="/:campaignId/adsets/:adSetId" element={<AdSetDetail />} />
      <Route path="/:campaignId/adsets/:adSetId/ads/new" element={<AdEditor />} />
      <Route path="/:campaignId/adsets/:adSetId/ads/:adId" element={<AdEditor />} />
    </Routes>
  );
};

export default CampaignRoutes;
