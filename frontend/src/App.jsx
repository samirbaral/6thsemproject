import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import TenantDashboard from './pages/TenantDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated, getUser } from './utils/auth';

function App() {
  const PrivateRoute = ({ children, allowedRoles }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }

    const user = getUser();
    if (allowedRoles && !allowedRoles.includes(user?.role)) {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      if (user?.role === 'OWNER') return <Navigate to="/owner/dashboard" replace />;
      if (user?.role === 'TENANT') return <Navigate to="/tenant/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={isAuthenticated() ? <Navigate to="/" replace /> : <Register />}
        />
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              (() => {
                const user = getUser();
                if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
                if (user?.role === 'OWNER') return <Navigate to="/owner/dashboard" replace />;
                if (user?.role === 'TENANT') return <Navigate to="/tenant/dashboard" replace />;
                return <Navigate to="/login" replace />;
              })()
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <PrivateRoute allowedRoles={['OWNER']}>
              <OwnerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/tenant/dashboard"
          element={
            <PrivateRoute allowedRoles={['TENANT']}>
              <TenantDashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
