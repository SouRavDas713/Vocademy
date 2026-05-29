import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/useApp';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { authLoading, isAuthenticated } = useApp();

  if (authLoading) {
    return <div className="px-4 py-16 text-center text-sm font-semibold text-zinc-500">Checking account access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
