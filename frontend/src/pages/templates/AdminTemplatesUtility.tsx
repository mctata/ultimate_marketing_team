import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a redirect component that forwards users to the implementation in src
const AdminTemplatesUtility: React.FC = () => {
  return <Navigate to="/content/templates/admin" replace />;
};

export default AdminTemplatesUtility;