import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store/store";
import { AuthProvider } from "./context/AuthContext";

try {
  const savedTheme = window.localStorage.getItem("collabspace-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDarkTheme = savedTheme ? savedTheme === "dark" : prefersDark;
  document.documentElement.classList.toggle("dark", useDarkTheme);
  document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
} catch {
  // The app falls back to its light palette when browser theme preferences are unavailable.
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </Provider>,
);
