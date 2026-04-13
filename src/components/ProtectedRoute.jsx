import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ProtectedRoute: en desarrollo se puede desactivar por completo la verificación
// estableciendo VITE_DISABLE_AUTH=true en .env (o se desactiva automáticamente en DEV).
const ProtectedRoute = ({ children, requiredRoles = [], bypass = false }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();

  const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true' || import.meta.env.DEV;

  // Si bypass prop está activada o la auth está deshabilitada por env, devolvemos children
  if (bypass || disableAuth) return children;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles si se especifican
  if (requiredRoles.length > 0 && currentUser) {
    const hasRequiredRole = requiredRoles.includes(currentUser.role);
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
