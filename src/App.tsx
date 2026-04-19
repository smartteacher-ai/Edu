import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LandingLayout from './components/LandingLayout';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import Dashboard from './pages/Dashboard';
import ContentList from './pages/ContentList';
import NewContent from './pages/NewContent';
import ContentViewer from './pages/ContentViewer';
import ProfilePage from './pages/ProfilePage';
import ActivityLogPage from './pages/ActivityLog';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          {/* Public Routes */}
          <Route element={<LandingLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            {/* Add dummy routes for about/terms/etc as needed */}
          </Route>

          {/* Protected App Routes */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="content" element={<ContentList />} />
            <Route path="content/new" element={<NewContent />} />
            <Route path="content/:id" element={<ContentViewer />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="activity" element={<ActivityLogPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
