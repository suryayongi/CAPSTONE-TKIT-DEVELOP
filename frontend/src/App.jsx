import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { HomePage } from './pages/HomePage';
import { ThemeDetailPage } from './pages/ThemeDetailPage';
import { WatchRoomPage } from './pages/WatchRoomPage';
import { DevDesignSystemPage } from './pages/DevDesignSystemPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ThemesPage } from './pages/admin/ThemesPage';
import { ThemeEpisodesPage } from './pages/admin/ThemeEpisodesPage';
import { StudioPage } from './pages/admin/StudioPage';
import { SiteSettingsPage } from './pages/admin/SiteSettingsPage';
import { PjjRecapPage } from './pages/admin/PjjRecapPage';
import { SuperAdminAccountsPage } from './pages/admin/SuperAdminAccountsPage';
import { authService } from './services/authService';

// Scroll to top helper on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Protected route wrapper for Admin CMS (role-aware)
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const location = useLocation();
  const user = authService.getCurrentUser();

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ restrictedFrom: location.pathname }}
      />
    );
  }

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to={authService.getHomeRouteForRole(user.role)} replace />;
  }

  return children;
};

// Redirect /admin sesuai peran akun (Super Admin vs Guru)
const AdminIndexRedirect = () => {
  const location = useLocation();
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ restrictedFrom: location.pathname }} />;
  }
  return <Navigate to={authService.getHomeRouteForRole(user.role)} replace />;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Rute Publik */}
          <Route path="/" element={<HomePage />} />
          <Route path="/tema/:slug" element={<ThemeDetailPage />} />
          <Route path="/tonton/:subthemeId" element={<WatchRoomPage />} />

          {/* Rute Dev Design System (Developer inspection only) */}
          <Route path="/dev/design-system" element={<DevDesignSystemPage />} />

          {/* Rute Autentikasi Guru & Super Admin */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          {/* Redirect Landing Sesuai Peran */}
          <Route path="/admin" element={<AdminIndexRedirect />} />

          {/* Landing Page Khusus Super Admin (Pengelolaan Akun Guru) */}
          <Route
            path="/admin/akun-guru"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminAccountsPage />
              </ProtectedRoute>
            }
          />

          {/* Rute Panel Guru & Super Admin CMS (Dilindungi Autentikasi) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tema"
            element={
              <ProtectedRoute>
                <ThemesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tema/:themeId"
            element={
              <ProtectedRoute>
                <ThemeEpisodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subtema/:subId/studio"
            element={
              <ProtectedRoute>
                <StudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pengaturan"
            element={
              <ProtectedRoute>
                <SiteSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rekap-pjj"
            element={
              <ProtectedRoute>
                <PjjRecapPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 ke Beranda */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
