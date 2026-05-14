import { Navigate } from 'react-router-dom';
import { useTeamAuth } from './TeamAuthContext';

export default function TeamProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useTeamAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#FAF9F6' }} />;
  }
  if (!user) return <Navigate to="/team" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/team/dashboard" replace />;
  return children;
}
