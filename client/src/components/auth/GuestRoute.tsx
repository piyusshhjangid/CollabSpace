import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

interface GuestRouteProps {
  children: ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-zinc-600">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    // Prevent redirect loops back to login/signup
    const destination = fromPath && !fromPath.startsWith("/login") && !fromPath.startsWith("/signup")
      ? fromPath
      : "/";

    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
