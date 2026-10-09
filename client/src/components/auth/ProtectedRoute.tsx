import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

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
    // Save current location to redirect back after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
