import { useContext } from 'react';
import { AuthContext } from '../../frontend/src/context/AuthContext';

/**
 * Custom hook for accessing authentication context
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;