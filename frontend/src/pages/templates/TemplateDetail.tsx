import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

interface TemplateDetailProps {
  testMode?: boolean;
  useMode?: boolean;
}

// This is a redirect component that forwards users to the implementation in src
const TemplateDetail: React.FC<TemplateDetailProps> = ({ testMode, useMode }) => {
  const { id } = useParams<{ id: string }>();
  
  if (testMode) {
    return <Navigate to={`/templates/${id}/test`} replace />;
  }
  
  if (useMode) {
    return <Navigate to={`/templates/${id}/use`} replace />;
  }
  
  return <Navigate to={`/templates/${id}`} replace />;
};

export default TemplateDetail;