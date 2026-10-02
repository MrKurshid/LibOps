import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

import PublicPage from './pages/public/PublicPage';
import LoginPage from './pages/admin/LoginPage';
import SignupPage from './pages/admin/SignupPage';
import DashboardPage from './pages/admin/DashboardPage';
import MembersPage from './pages/admin/MembersPage';
import SeatsPage from './pages/admin/SeatsPage';
import SlotsPage from './pages/admin/SlotsPage';
import FeesPage from './pages/admin/FeesPage';
import NoticesPage from './pages/admin/NoticesPage';
import LibrarySettingsPage from './pages/admin/LibrarySettingsPage';
import SettingsPage from './pages/admin/SettingsPage';

const AdminRoute = ({ children }) => (
  <ProtectedRoute>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin/signup" element={<SignupPage />} />
            <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
            <Route path="/admin/members" element={<AdminRoute><MembersPage /></AdminRoute>} />
            <Route path="/admin/seats" element={<AdminRoute><SeatsPage /></AdminRoute>} />
            <Route path="/admin/slots" element={<AdminRoute><SlotsPage /></AdminRoute>} />
            <Route path="/admin/fees" element={<AdminRoute><FeesPage /></AdminRoute>} />
            <Route path="/admin/notices" element={<AdminRoute><NoticesPage /></AdminRoute>} />
            <Route path="/admin/library" element={<AdminRoute><LibrarySettingsPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/library/:id" element={<PublicPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '10px', fontSize: '14px', fontWeight: '500' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
