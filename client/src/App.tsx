import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/layout/Shell";
import HomePage from "./pages/HomePage";
import ProjectsPage from "./pages/ProjectPage";
import TasksPage from "./pages/TasksPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import GuestRoute from "./components/auth/GuestRoute";

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

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
