import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DocumentsPage from '../pages/DocumentsPage';
import DocumentWorkspacePage from '../pages/DocumentWorkspacePage';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/documents" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      }
    />
    <Route
      path="/register"
      element={
        <AuthRoute>
          <RegisterPage />
        </AuthRoute>
      }
    />
    <Route
      path="/documents"
      element={
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/documents/:id"
      element={
        <ProtectedRoute>
          <DocumentWorkspacePage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/documents" replace />} />
  </Routes>
);

export default AppRoutes;
