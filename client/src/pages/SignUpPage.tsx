import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";

export default function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
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

      // The backend creates the account and requires subsequent login
      navigate("/login", {
        replace: true,
        state: {
          from: (location.state as { from?: { pathname?: string; search?: string } })?.from,
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
        setGeneralError("An unexpected error occurred during registration.");
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
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Get started with AI Delivery Control Plane for your team
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          {/* General Error Banner */}
          {generalError && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">Registration failed</p>
                <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{generalError}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Full Name
              </label>
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
                className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                  nameError
                    ? "border-red-400 focus:border-red-500"
                    : "border-zinc-300"
                }`}
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Work Email
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
                placeholder="alex@company.com"
                className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                  emailError
                    ? "border-red-400 focus:border-red-500"
                    : "border-zinc-300"
                }`}
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
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
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Min. 8 characters"
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
                <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? "confirm-error" : undefined}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Re-enter password"
                  className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                    confirmPasswordError
                      ? "border-red-400 focus:border-red-500"
                      : "border-zinc-300"
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-error" className="mt-1 text-xs text-red-600" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (termsError) setTermsError("");
                  }}
                  disabled={isSubmitting}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500/20"
                />
                <span className="text-xs text-zinc-600 leading-relaxed">
                  I agree to the CollabSpace Terms of Service and Privacy Policy.
                </span>
              </label>
              {termsError && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {termsError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300 mt-2"
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
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-purple-600 hover:text-purple-700 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
