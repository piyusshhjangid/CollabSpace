import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/layout/Shell";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectPage";
import TasksPage from "./pages/TasksPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";
import OnboardingRoute from "./components/auth/OnboardingRoute";
const ExecutionPage = lazy(() => import("./pages/ExecutionPage"));

const App = () => {
  return (
    <div className="h-screen">
      <Routes>
        {/* Guest routes: accessible only to unauthenticated users */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignUpPage />
            </GuestRoute>
          }
        />

        {/* Protected routes: requires valid authenticated session */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shell>
                <HomePage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Shell>
                <ProjectsPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Shell>
                <TasksPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route path="/execution" element={<ProtectedRoute><Shell><Suspense fallback={<div className="flex h-80 items-center justify-center text-sm text-slate-500">Loading execution view…</div>}><ExecutionPage /></Suspense></Shell></ProtectedRoute>} />

        {/* Onboarding: authenticated users without a workspace land here */}
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <OnboardingPage />
            </OnboardingRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
