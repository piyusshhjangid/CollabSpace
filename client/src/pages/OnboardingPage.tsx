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

  // Create workspace form state
  const [activePanel, setActivePanel] = useState<ActivePanel>(() => {
    // If there's an invite token in the URL, open join panel immediately
    return searchParams.get("token") ? "join" : null;
  });

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceNameError, setWorkspaceNameError] = useState("");

  // Join invitation form state
  const [inviteToken, setInviteToken] = useState(() => searchParams.get("token") ?? "");
  const [inviteTokenError, setInviteTokenError] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Always clears local session
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
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-900">
            CollabSpace
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-xs text-zinc-500">
              Signed in as{" "}
              <span className="font-medium text-zinc-700">{user.email}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-red-600 focus:outline-none"
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
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Welcome to CollabSpace
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-3 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
              Your account is ready. To start collaborating, create a workspace
              for your team or join an existing one using an invitation.
            </p>
          </div>

          {/* Action cards */}
          {!activePanel && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {/* Create workspace card */}
              <button
                onClick={() => {
                  setActivePanel("create");
                  createWorkspaceMutation.reset();
                }}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Create a workspace
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Start a new workspace and invite your team. You'll be the
                    owner.
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-blue-600">
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              {/* Join workspace card */}
              <button
                onClick={() => {
                  setActivePanel("join");
                  acceptInvitationMutation.reset();
                }}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Join with an invitation
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                    Have an invitation token? Enter it here to join your team's
                    workspace.
                  </p>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-emerald-600">
                  Use invitation <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          )}

          {/* Create Workspace Panel */}
          {activePanel === "create" && (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-900">
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
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Give your workspace a name. You'll be assigned as the{" "}
                <strong>OWNER</strong> by the server once it's created.
              </p>

              {/* Create error banner */}
              {getCreateErrorMessage() && (
                <div
                  className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <p>{getCreateErrorMessage()}</p>
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} noValidate>
                <div>
                  <label
                    htmlFor="workspace-name"
                    className="block text-xs font-medium text-zinc-700 mb-1.5"
                  >
                    Workspace name
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
                    className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                      workspaceNameError
                        ? "border-red-400 focus:border-red-500"
                        : "border-zinc-300 focus:border-blue-600"
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

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={createWorkspaceMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createWorkspaceMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
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
                    className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition hover:text-zinc-900 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Join with Invitation Panel */}
          {activePanel === "join" && (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-900">
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
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Enter the invitation token sent to{" "}
                <strong>{user?.email}</strong>. The token is validated server-side and you'll be
                added as a{" "}
                <strong>MEMBER</strong> of the workspace.
              </p>

              {/* Invitation error banner */}
              {getJoinErrorMessage() && (
                <div
                  className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Invitation failed</p>
                    <p className="mt-0.5">{getJoinErrorMessage()}</p>
                    {getJoinErrorMessage()?.includes("expired") && (
                      <p className="mt-1 text-zinc-600">
                        Please ask a workspace admin to send a new invitation.
                      </p>
                    )}
                    {getJoinErrorMessage()?.includes("different email") && (
                      <p className="mt-1 text-zinc-600">
                        This invitation was sent to a different email address. Sign in with
                        the correct account, or request a new invitation.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleAcceptInvitation} noValidate>
                <div>
                  <label
                    htmlFor="invite-token"
                    className="block text-xs font-medium text-zinc-700 mb-1.5"
                  >
                    Invitation token
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
                    placeholder="Paste your invitation token here"
                    aria-invalid={Boolean(inviteTokenError)}
                    aria-describedby={inviteTokenError ? "token-error" : undefined}
                    className={`block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 placeholder:font-sans transition focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-zinc-100 ${
                      inviteTokenError
                        ? "border-red-400 focus:border-red-500"
                        : "border-zinc-300 focus:border-blue-600"
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

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={acceptInvitationMutation.isPending}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {acceptInvitationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Joining...</span>
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
                    className="rounded-lg px-4 py-2 text-sm text-zinc-600 transition hover:text-zinc-900 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success state */}
          {(createWorkspaceMutation.isSuccess || acceptInvitationMutation.isSuccess) && (
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <p>
                {createWorkspaceMutation.isSuccess
                  ? "Workspace created! Entering your workspace..."
                  : "Invitation accepted! Entering your workspace..."}
              </p>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-emerald-600" />
            </div>
          )}

          {/* Divider hint */}
          {!activePanel && (
            <p className="mt-8 text-center text-xs text-zinc-400">
              Your role in a workspace is assigned by the backend and reflects your membership.{" "}
              <br className="hidden sm:block" />
              If you were invited, your role will match the invitation's permissions.
            </p>
          )}

          {/* Need help hint */}
          {!activePanel && (
            <div className="mt-4 text-center">
              <p className="text-xs text-zinc-400">
                Need to use a different account?{" "}
                <Link
                  to="/login"
                  onClick={handleLogout}
                  className="text-blue-600 hover:underline"
                >
                  Sign out and sign in again
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
