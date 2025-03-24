import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a redirect component that forwards users to the implementation in src
const TemplateDiagnostics: React.FC = () => {
  return <Navigate to="/content/templates/diagnostics" replace />;
};

export default TemplateDiagnostics;