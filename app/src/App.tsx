import { Routes, Route } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';
import AppNavbar from '@/components/AppNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/DashboardPage';
import ActionsPage from './pages/ActionsPage';
import SimulatorPage from './pages/SimulatorPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MethodologyPage from './pages/MethodologyPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import LogPage from './pages/LogPage';
import WorldPage from './pages/WorldPage';
import SocialPage from './pages/SocialPage';
import CoachPage from './pages/CoachPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/methodology" element={<AppLayout><MethodologyPage /></AppLayout>} />
        <Route path="/leaderboard" element={<AppLayout><LeaderboardPage /></AppLayout>} />
        <Route path="/calculator" element={<AppLayout><CalculatorPage /></AppLayout>} />
        <Route path="/dashboard" element={<AppLayout><ProtectedRoute><DashboardPage /></ProtectedRoute></AppLayout>} />
        <Route path="/actions" element={<AppLayout><ProtectedRoute><ActionsPage /></ProtectedRoute></AppLayout>} />
        <Route path="/simulator" element={<AppLayout><ProtectedRoute><SimulatorPage /></ProtectedRoute></AppLayout>} />
        <Route path="/profile" element={<AppLayout><ProtectedRoute><ProfilePage /></ProtectedRoute></AppLayout>} />
        <Route path="/log" element={<AppLayout><ProtectedRoute><LogPage /></ProtectedRoute></AppLayout>} />
        <Route path="/world" element={<AppLayout><ProtectedRoute><WorldPage /></ProtectedRoute></AppLayout>} />
        <Route path="/social" element={<AppLayout><ProtectedRoute><SocialPage /></ProtectedRoute></AppLayout>} />
        <Route path="/coach" element={<AppLayout><ProtectedRoute><CoachPage /></ProtectedRoute></AppLayout>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
