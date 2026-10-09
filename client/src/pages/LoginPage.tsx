import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";

const REMEMBERED_EMAIL_KEY = "collabspace_remembered_email";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registrationMessage = (location.state as { registrationMessage?: string })
    ?.registrationMessage;
  const registeredEmail = (location.state as { registeredEmail?: string })
    ?.registeredEmail;

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY));
    } catch {
      return false;
    }
  });

  const [email, setEmail] = useState<string>(() => {
    if (registeredEmail) return registeredEmail;
    try {
      return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  });

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email address is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setGeneralError("");

    try {
      await login({
        email: email.trim(),
        password,
      });

      // Handle remember me preference
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Ignore storage errors
      }

      // Navigate to intended destination or root
      const fromPath = (location.state as { from?: { pathname?: string } })?.from
        ?.pathname;
      const destination =
        fromPath && !fromPath.startsWith("/login") && !fromPath.startsWith("/signup")
          ? fromPath
          : "/";

      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGeneralError("Invalid email or password. Please try again.");
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred during login. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900">
      {/* Left Column: Login Form */}
      <div className="flex flex-1 flex-col justify-between px-6 py-10 sm:px-12 md:px-16 lg:max-w-xl xl:px-20">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              CollabSpace
            </span>
          </div>

          <div className="mt-12 sm:mt-16">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your credentials to access your engineering workspaces and projects.
            </p>
          </div>

          {/* Registration Success Banner */}
          {registrationMessage && (
            <div
              className="mt-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p>{registrationMessage}</p>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div
              className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-medium">Authentication failed</p>
                <p className="mt-0.5 text-xs text-red-700">{generalError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                Work Email
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="alex@company.com"
                  className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    emailError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300 focus:border-blue-600"
                  }`}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    passwordError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300 focus:border-blue-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition hover:text-zinc-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember my email</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign up for CollabSpace
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} CollabSpace. AI Delivery Control Plane.</p>
        </div>
      </div>

      {/* Right Column: SaaS Value Proposition Panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex xl:p-16">
        {/* Background gradient embellishment */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 backdrop-blur-sm">
            <Activity className="h-3.5 w-3.5" />
            <span>Continuous Delivery Health</span>
          </div>

          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Control plane visibility for modern engineering teams.
          </h2>
          <p className="mt-4 max-w-lg text-sm text-zinc-300">
            Real-time execution tracking, role-based governance, and tenant-isolated workflows engineered for delivery confidence.
          </p>
        </div>

        {/* Highlight cards */}
        <div className="relative z-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5 backdrop-blur-sm">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
            <h3 className="mt-3 text-sm font-semibold text-white">Tenant Isolated</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Strict multi-tenant boundary enforcement and RBAC protections across all resources.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-5 backdrop-blur-sm">
            <Layers className="h-5 w-5 text-blue-400" />
            <h3 className="mt-3 text-sm font-semibold text-white">Unified Delivery</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Connect tasks, projects, and delivery milestones in a single control dashboard.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/80 pt-6 text-xs text-zinc-500">
          <span>Production-grade security</span>
          <span>Zero cross-tenant data leakage</span>
        </div>
      </div>
    </div>
  );
}
