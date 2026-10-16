import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCreateWorkspace, useAcceptInvitation } from "../hooks/useWorkspaces";
import { ApiError } from "../lib/api";
import {
  Layers,
  Building2,
  Link2,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

type ActivePanel = null | "create" | "join";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const createWorkspaceMutation = useCreateWorkspace();
  const acceptInvitationMutation = useAcceptInvitation();

  const [activePanel, setActivePanel] = useState<ActivePanel>(() => {
    return searchParams.get("token") ? "join" : null;
  });

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceNameError, setWorkspaceNameError] = useState("");

  const [inviteToken, setInviteToken] = useState(() => searchParams.get("token") ?? "");
  const [inviteTokenError, setInviteTokenError] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Local session is always cleared
    }
  };

  // --- Create Workspace ---
  const validateWorkspaceName = (): boolean => {
    const trimmed = workspaceName.trim();
    if (!trimmed) {
      setWorkspaceNameError("Workspace name is required.");
      return false;
    }
    if (trimmed.length > 100) {
      setWorkspaceNameError("Workspace name must be 100 characters or fewer.");
      return false;
    }
    setWorkspaceNameError("");
    return true;
  };

  const handleCreateWorkspace = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateWorkspaceName()) return;

    try {
      await createWorkspaceMutation.mutateAsync(workspaceName.trim());
      navigate("/", { replace: true });
    } catch {
      // Error displayed via mutation.error
    }
  };

  // --- Join Workspace ---
  const validateToken = (): boolean => {
    const trimmed = inviteToken.trim();
    if (!trimmed) {
      setInviteTokenError("Invitation token is required.");
      return false;
    }
    setInviteTokenError("");
    return true;
  };

  const handleAcceptInvitation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateToken()) return;

    try {
      await acceptInvitationMutation.mutateAsync(inviteToken.trim());
      navigate("/", { replace: true });
    } catch {
      // Error displayed via mutation.error
    }
  };

  const getCreateErrorMessage = (): string | null => {
    const err = createWorkspaceMutation.error;
    if (!err) return null;
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "Failed to create workspace. Please try again.";
  };

  const getJoinErrorMessage = (): string | null => {
    const err = acceptInvitationMutation.error;
    if (!err) return null;
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "Failed to accept invitation. Please try again.";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Top bar matching Shell TopBar */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            CollabSpace
          </span>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="text-xs text-zinc-500">
                <span className="font-medium text-zinc-800">{user.email}</span>
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-2xl">
          {/* Welcome heading */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Welcome to CollabSpace{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="mt-2.5 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Your account is ready. Create a new engineering workspace for your team or join an existing one using an invitation.
            </p>
          </div>

          {/* Action cards */}
          {!activePanel && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {/* Create workspace card */}
              <button
                onClick={() => {
                  setActivePanel("create");
                  createWorkspaceMutation.reset();
                }}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition group-hover:bg-purple-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Create a workspace
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Start a new workspace for your organization. You will be assigned as the workspace owner.
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-purple-600">
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              {/* Join workspace card */}
              <button
                onClick={() => {
                  setActivePanel("join");
                  acceptInvitationMutation.reset();
                }}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 transition group-hover:bg-zinc-200">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Join with an invitation
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Have an invitation token? Enter it here to join an existing team workspace as a member.
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">
                  Use invitation <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          )}

          {/* Create Workspace Panel */}
          {activePanel === "create" && (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Create a workspace
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActivePanel(null);
                    setWorkspaceName("");
                    setWorkspaceNameError("");
                    createWorkspaceMutation.reset();
                  }}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Enter your workspace or organization name. The backend will atomically create the workspace and establish your membership with the <strong>OWNER</strong> role.
              </p>

              {/* Error banner */}
              {getCreateErrorMessage() && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <p className="leading-relaxed">{getCreateErrorMessage()}</p>
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} noValidate>
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                  >
                    Workspace Name
                  </label>
                  <input
                    id="workspace-name"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => {
                      setWorkspaceName(e.target.value);
                      if (workspaceNameError) setWorkspaceNameError("");
                      if (createWorkspaceMutation.error) createWorkspaceMutation.reset();
                    }}
                    disabled={createWorkspaceMutation.isPending}
                    placeholder="e.g. Acme Engineering"
                    aria-invalid={Boolean(workspaceNameError)}
                    aria-describedby={workspaceNameError ? "workspace-name-error" : undefined}
                    className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                      workspaceNameError
                        ? "border-red-400 focus:border-red-500"
                        : "border-zinc-300"
                    }`}
                  />
                  {workspaceNameError && (
                    <p
                      id="workspace-name-error"
                      className="mt-1.5 text-xs text-red-600"
                      role="alert"
                    >
                      {workspaceNameError}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={createWorkspaceMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300"
                  >
                    {createWorkspaceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating workspace...</span>
                      </>
                    ) : (
                      <span>Create workspace</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel(null);
                      setWorkspaceName("");
                      setWorkspaceNameError("");
                      createWorkspaceMutation.reset();
                    }}
                    disabled={createWorkspaceMutation.isPending}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Join with Invitation Panel */}
          {activePanel === "join" && (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-900">
                    Join with an invitation
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setActivePanel(null);
                    setInviteToken("");
                    setInviteTokenError("");
                    acceptInvitationMutation.reset();
                  }}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Paste the invitation token sent to <strong>{user?.email}</strong>. Tokens are verified server-side and grant membership with the <strong>MEMBER</strong> role.
              </p>

              {/* Error banner */}
              {getJoinErrorMessage() && (
                <div
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Invitation failed</p>
                    <p className="mt-0.5 leading-relaxed">{getJoinErrorMessage()}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAcceptInvitation} noValidate>
                <div>
                  <label
                    htmlFor="invite-token"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                  >
                    Invitation Token
                  </label>
                  <input
                    id="invite-token"
                    type="text"
                    value={inviteToken}
                    onChange={(e) => {
                      setInviteToken(e.target.value);
                      if (inviteTokenError) setInviteTokenError("");
                      if (acceptInvitationMutation.error) acceptInvitationMutation.reset();
                    }}
                    disabled={acceptInvitationMutation.isPending}
                    placeholder="e.g. 4f3b89e2..."
                    aria-invalid={Boolean(inviteTokenError)}
                    aria-describedby={inviteTokenError ? "token-error" : undefined}
                    className={`block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                      inviteTokenError
                        ? "border-red-400 focus:border-red-500"
                        : "border-zinc-300"
                    }`}
                  />
                  {inviteTokenError && (
                    <p
                      id="token-error"
                      className="mt-1.5 text-xs text-red-600"
                      role="alert"
                    >
                      {inviteTokenError}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={acceptInvitationMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300"
                  >
                    {acceptInvitationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Joining workspace...</span>
                      </>
                    ) : (
                      <span>Join workspace</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel(null);
                      setInviteToken("");
                      setInviteTokenError("");
                      acceptInvitationMutation.reset();
                    }}
                    disabled={acceptInvitationMutation.isPending}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success state */}
          {(createWorkspaceMutation.isSuccess || acceptInvitationMutation.isSuccess) && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                {createWorkspaceMutation.isSuccess
                  ? "Workspace created! Redirecting to application shell..."
                  : "Invitation accepted! Redirecting to application shell..."}
              </p>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-emerald-600" />
            </div>
          )}

          {/* Subtitle note */}
          {!activePanel && (
            <div className="mt-8 text-center">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Need to sign in with a different account?{" "}
                <Link
                  to="/login"
                  onClick={handleLogout}
                  className="font-medium text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Sign out
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
