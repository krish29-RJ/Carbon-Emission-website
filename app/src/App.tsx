import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import AppNavbar from "@/components/AppNavbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense } from "react";
const Home = React.lazy(() => import("./pages/Home"));
const AuthPage = React.lazy(() => import("./pages/AuthPage"));
const CalculatorPage = React.lazy(() => import("./pages/CalculatorPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const ActionsPage = React.lazy(() => import("./pages/ActionsPage"));
const SimulatorPage = React.lazy(() => import("./pages/SimulatorPage"));
const LeaderboardPage = React.lazy(() => import("./pages/LeaderboardPage"));
const MethodologyPage = React.lazy(() => import("./pages/MethodologyPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const LogPage = React.lazy(() => import("./pages/LogPage"));
const WorldPage = React.lazy(() => import("./pages/WorldPage"));
const SocialPage = React.lazy(() => import("./pages/SocialPage"));
const CoachPage = React.lazy(() => import("./pages/CoachPage"));

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
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/methodology"
              element={
                <AppLayout>
                  <MethodologyPage />
                </AppLayout>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <AppLayout>
                  <LeaderboardPage />
                </AppLayout>
              }
            />
            <Route
              path="/calculator"
              element={
                <AppLayout>
                  <CalculatorPage />
                </AppLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/actions"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <ActionsPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/simulator"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <SimulatorPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/log"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <LogPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/world"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <WorldPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/social"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <SocialPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/coach"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <CoachPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}
