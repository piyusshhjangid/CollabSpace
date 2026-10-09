import {
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, clearCredentials } from "../store/slices/authSlice";
import { setCurrentWorkspaceId } from "../store/slices/uiSlice";
import {
  clearSession,
  getRefreshToken,
  onSessionExpired,
  setSession,
} from "../lib/authSession";
import { login as loginApi, logout as logoutApi, register as registerApi } from "../api/auth";
import type { AuthUser, LoginPayload, RegisterPayload } from "../types/auth";
import { workspaceKeys } from "../hooks/useWorkspaces";
import { projectKeys } from "../hooks/useProjects";
import { taskKeys } from "../hooks/useTasks";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const performLocalLogout = useCallback(() => {
    clearSession();
    dispatch(clearCredentials());
    dispatch(setCurrentWorkspaceId(null));

    // Remove user-scoped queries so cross-user data leakage cannot occur
    queryClient.removeQueries({ queryKey: workspaceKeys.all });
    queryClient.removeQueries({ queryKey: projectKeys.all });
    queryClient.removeQueries({ queryKey: taskKeys.all });
  }, [dispatch, queryClient]);

  // Handle session expiration triggered by 401s in apiFetch
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      performLocalLogout();
    });

    return () => {
      unsubscribe();
    };
  }, [performLocalLogout]);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthUser> => {
      const result = await loginApi(payload);
      setSession(result);
      dispatch(setCredentials({ user: result.user }));
      return result.user;
    },
    [dispatch],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthUser> => {
      const newUser = await registerApi(payload);
      return newUser;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    try {
      await logoutApi(refreshToken);
    } finally {
      performLocalLogout();
    }
  }, [performLocalLogout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing: false,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
