import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ContentOverview from './ContentOverview';
import ContentLibrary from './ContentLibrary';
import ContentCalendar from './ContentCalendar';
import ContentDetail from './ContentDetail';
import ContentGenerator from './ContentGenerator';
import { Box } from '@mui/material';
import Templates from '../templates/Templates';
import TemplateDetail from '../templates/TemplateDetail';

const Content = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Routes>
        <Route path="/" element={<ContentOverview />} />
        <Route path="/library" element={<ContentLibrary />} />
        <Route path="/calendar" element={<ContentCalendar />} />
        <Route path="/generator" element={<ContentGenerator />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:id/use" element={<TemplateDetail useMode={true} />} />
        <Route path="/templates/:id" element={<TemplateDetail />} />
        <Route path="/:id" element={<ContentDetail />} />
        <Route path="*" element={<Navigate to="/content" />} />
      </Routes>
    </Box>
  );
};

export default Content;