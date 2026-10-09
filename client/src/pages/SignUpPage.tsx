import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Layers,
  CheckCircle,
} from "lucide-react";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");
    setGeneralError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Full name is required.");
      isValid = false;
    }

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
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    if (!termsAccepted) {
      setTermsError("You must agree to the terms to proceed.");
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // The backend creates the user and requires subsequent login
      navigate("/login", {
        replace: true,
        state: {
          registeredEmail: email.trim(),
          registrationMessage:
            "Your account was created successfully! Please sign in with your credentials.",
        },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.message.toLowerCase().includes("email")) {
          setEmailError(err.message);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("Registration failed. Please check your information and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-50 text-zinc-900">
      {/* Left Column: Sign Up Form */}
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

          <div className="mt-10 sm:mt-14">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Join your team's engineering workspace and start tracking delivery pipelines.
            </p>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div
              className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="font-medium">Registration failed</p>
                <p className="mt-0.5 text-xs text-red-700">{generalError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700"
              >
                Full Name
              </label>
              <div className="mt-1.5">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "name-error" : undefined}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Alex Rivera"
                  className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    nameError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300 focus:border-blue-600"
                  }`}
                />
              </div>
              {nameError && (
                <p id="name-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>

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
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : "password-hint"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="At least 8 characters"
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
              {passwordError ? (
                <p id="password-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {passwordError}
                </p>
              ) : (
                <p id="password-hint" className="mt-1 text-xs text-zinc-500">
                  Must be at least 8 characters long.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700"
              >
                Confirm Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Repeat your password"
                  className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    confirmPasswordError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300 focus:border-blue-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 transition hover:text-zinc-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="mt-1.5 text-xs text-red-600" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (termsError) setTermsError("");
                  }}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I understand that CollabSpace enforces tenant-isolated workspaces and I agree to the service policies.
                </span>
              </label>
              {termsError && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {termsError}
                </p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-10 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} CollabSpace. AI Delivery Control Plane.</p>
        </div>
      </div>

      {/* Right Column: Information Panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex xl:p-16">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Architecture</span>
          </div>

          <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Built for engineering integrity and delivery speed.
          </h2>
          <p className="mt-4 max-w-lg text-sm text-zinc-300">
            Get started in seconds. CollabSpace isolates your data, provides role-based access, and tracks software projects end-to-end.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/40 p-4 backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              Role-based access control protecting projects and task assignments.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/40 p-4 backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-zinc-300">
              Single pane of glass for real-time task boards and progress summaries.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/80 pt-6 text-xs text-zinc-500">
          <span>Enterprise grade security</span>
          <span>Automated token security</span>
        </div>
      </div>
    </div>
  );
}
