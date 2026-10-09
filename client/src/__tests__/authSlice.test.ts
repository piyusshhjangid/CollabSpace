import { describe, it, expect, beforeEach } from "vitest";
import authReducer, {
  setCredentials,
  clearCredentials,
  type AuthState,
} from "../store/slices/authSlice";

describe("Redux authSlice", () => {
  const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("handles setCredentials action with non-sensitive user info only", () => {
    const user = {
      id: "u-1",
      name: "Alex",
      email: "alex@collabspace.dev",
    };

    const nextState = authReducer(initialState, setCredentials({ user }));

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(user);

    // Verify state does NOT contain credentials/tokens
    const stateRecord = nextState as unknown as Record<string, unknown>;
    expect(stateRecord.accessToken).toBeUndefined();
    expect(stateRecord.refreshToken).toBeUndefined();
  });

  it("handles clearCredentials action on logout", () => {
    const loggedInState: AuthState = {
      isAuthenticated: true,
      user: {
        id: "u-1",
        name: "Alex",
        email: "alex@collabspace.dev",
      },
    };

    const nextState = authReducer(loggedInState, clearCredentials());

    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
  });
});
