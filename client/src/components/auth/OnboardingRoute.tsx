import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

interface OnboardingRouteProps {
  children: ReactNode;
}

/**
 * OnboardingRoute guard.
 *
 * Allows access to the /onboarding page only to authenticated users.
 * - Unauthenticated users → /login
 * - Authenticated users (with or without workspaces) → allowed through
 *
 * The workspace check (redirect back to /) is handled inside OnboardingPage itself
 * after a successful workspace creation or invitation acceptance.
 */
export default function OnboardingRoute({ children }: OnboardingRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-zinc-600">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
