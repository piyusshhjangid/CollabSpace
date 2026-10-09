import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../../types/auth";
import { getAccessToken, getStoredUser } from "../../lib/authSession";

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

const initialToken = typeof window !== "undefined" ? getAccessToken() : null;
const initialUser = typeof window !== "undefined" ? getStoredUser() : null;

const initialState: AuthState = {
  isAuthenticated: Boolean(initialToken && initialUser),
  user: initialToken ? initialUser : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser }>,
    ) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
    },
    clearCredentials(state) {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
