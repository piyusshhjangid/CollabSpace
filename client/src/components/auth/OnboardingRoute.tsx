import { type ReactNode } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { Loader2 } from "lucide-react";

interface OnboardingRouteProps {
  children: ReactNode;
}

/**
 * OnboardingRoute guard:
 * - Unauthenticated user -> /login
 * - Authenticated user with existing workspaces (and no join token) -> / (Shell)
 * - Authenticated user with 0 workspaces (or accepting an invite) -> allow to /onboarding
 */
export default function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasToken = Boolean(searchParams.get("token"));
  const { data: workspaces = [], isLoading } = useWorkspaces();

  if (isInitializing || (isAuthenticated && isLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-zinc-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user already belongs to workspaces and is not trying to accept an invitation token,
  // guide them into their existing workspace in the application shell.
  if (workspaces.length > 0 && !hasToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
