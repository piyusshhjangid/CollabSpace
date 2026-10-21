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
      setEmailError("Email is required.");
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
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Storage unavailable or disabled
    }

    try {
      await login({
        email: email.trim(),
        password,
      });

      const from = (location.state as { from?: { pathname?: string; search?: string } })?.from;
      const destination = from ? `${from.pathname ?? "/"}${from.search ?? ""}` : "/";

      const safeDestination =
        destination.startsWith("/login") || destination.startsWith("/signup")
          ? "/"
          : destination;

      navigate(safeDestination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGeneralError("Invalid email or password. Please check your credentials.");
        } else if (err.status === 429) {
          setGeneralError("Too many attempts. Please wait a moment before trying again.");
        } else {
          setGeneralError(err.message || "Failed to sign in. Please try again.");
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-zinc-900">
              CollabSpace
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            AI Delivery Control Plane for engineering teams
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          {/* Registration Success Banner */}
          {registrationMessage && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <p>{registrationMessage}</p>
            </div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Sign in failed</p>
                <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{generalError}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Email Address
              </label>
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
                placeholder="name@company.com"
                className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                  emailError
                    ? "border-red-400 focus:border-red-500"
                    : "border-zinc-300"
                }`}
              />
              {emailError && (
                <p id="email-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
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
                  className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    passwordError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500/20"
                />
                <span className="text-xs text-zinc-600 font-medium">Remember my email</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300"
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

          <div className="mt-6 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              state={{ from: (location.state as { from?: { pathname?: string; search?: string } })?.from }}
              className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
