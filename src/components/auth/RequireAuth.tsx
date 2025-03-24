import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * A wrapper component that checks if the user is authenticated
 * and redirects to the login page if not.
 * This is a simplified mock implementation for the demo.
 */
const RequireAuth = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulate checking authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // In a real app, this would check a token or session
      // For demo purposes, we'll assume the user is always authenticated
      setIsAuthenticated(true);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to the login page but save the current location they were
    // trying to go to when they were redirected. This allows us
    // to send them along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
