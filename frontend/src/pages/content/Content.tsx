import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import ContentOverview from './ContentOverview';
import ContentLibrary from './ContentLibrary';
import ContentCalendar from './ContentCalendar';
import ContentDetail from './ContentDetail';
import ContentGenerator from './ContentGenerator';
import { Box, Typography, Alert } from '@mui/material';
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
  
  // If no brand is selected, show a helpful message
  if (!selectedBrand) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Please select a brand using the dropdown in the header to view content.
        </Alert>
        <Typography variant="body1">
          Content management requires a brand context. Use the brand selector in the top right of the header.
        </Typography>
      </Box>
    );
  }
  
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