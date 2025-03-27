import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import ContentOverview from './ContentOverview';
import ContentLibrary from './ContentLibrary';
import ContentCalendar from './ContentCalendar';
import ContentDetail from './ContentDetail';
import ContentGenerator from './ContentGenerator';
import ContentSEO from './ContentSEO';
import { Box } from '@mui/material';
import Templates from '../templates/Templates';
import TemplateDetail from '../templates/TemplateDetail';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const Content = () => {
  const location = useLocation();
  const params = useParams();
  const { selectedBrand } = useSelector((state: RootState) => state.brands);
  
  useEffect(() => {
    console.log('Content component rendered with:');
    console.log('- Location:', location);
    console.log('- Params:', params);
    console.log('- Selected Brand:', selectedBrand);
  }, [location, params, selectedBrand]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Routes>
        <Route path="/" element={<ContentOverview />} />
        <Route path="/library" element={<ContentLibrary />} />
        <Route path="/calendar" element={<ContentCalendar />} />
        <Route path="/generator" element={<ContentGenerator />} />
        <Route path="/seo" element={<ContentSEO />} />
        <Route path="/seo/:contentId" element={<ContentSEO />} />
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