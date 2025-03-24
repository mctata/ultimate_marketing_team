import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a redirect component that forwards users to the implementation in src
const TemplateTestWorkspace: React.FC = () => {
  return <Navigate to="/templates/test-workspace" replace />;
};

export default TemplateTestWorkspace;