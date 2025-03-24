import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a redirect component that will forward users 
// from the frontend templates route to the implementation in src
const Templates: React.FC = () => {
  return <Navigate to="/templates" replace />;
};

export default Templates;