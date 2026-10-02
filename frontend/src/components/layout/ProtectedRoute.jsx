import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
};

export default ProtectedRoute;
