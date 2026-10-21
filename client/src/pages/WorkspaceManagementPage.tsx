import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, Check, Copy, Link2, LoaderCircle, Mail, MailPlus, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePermissions } from "../hooks/usePermissions";
import { useAcceptInvitation, useCreateInvitation, useCreateWorkspace, useDeleteWorkspace, useRevokeInvitation, useUpdateWorkspace, useWorkspaceInvitations } from "../hooks/useWorkspaces";
import { ApiError } from "../lib/api";

const roleLabel = (role: string) => role.charAt(0) + role.slice(1).toLowerCase();

export default function WorkspaceManagementPage() {
  const { currentWorkspace, setCurrentWorkspace, workspaces } = useWorkspace();
  const permissions = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const acceptInvitation = useAcceptInvitation();
  const inviteMember = useCreateInvitation(currentWorkspace?.id ?? "");
  const invitationsQuery = useWorkspaceInvitations(currentWorkspace?.id ?? null, permissions.canInviteMember);
  const revokeInvite = useRevokeInvitation(currentWorkspace?.id ?? "");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteToken, setInviteToken] = useState(() => searchParams.get("token") ?? "");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const createdInvite = inviteMember.data;
  const inviteLink = useMemo(() => createdInvite ? `${window.location.origin}/onboarding?token=${encodeURIComponent(createdInvite.token)}` : "", [createdInvite]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) setInviteToken(token);
  }, [searchParams]);

  const errorMessage = (error: unknown) => error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong. Please try again.";

  const submitNewWorkspace = (event: FormEvent) => {
    event.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspace.mutate(newWorkspaceName.trim(), { onSuccess: () => { setNewWorkspaceName(""); setShowCreateWorkspace(false); } });
  };

  const submitWorkspaceName = (event: FormEvent) => {
    event.preventDefault();
    if (!editingId || !editName.trim()) return;
    updateWorkspace.mutate({ id: editingId, name: editName.trim() }, { onSuccess: () => setEditingId(null) });
  };

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    inviteMember.mutate(email.trim(), { onSuccess: () => setEmail("") });
  };

  const submitAcceptance = (event: FormEvent) => {
    event.preventDefault();
    if (!inviteToken.trim()) return;
    acceptInvitation.mutate(inviteToken.trim(), { onSuccess: () => {
      setInviteToken("");
      const next = new URLSearchParams(searchParams);
      next.delete("token");
      setSearchParams(next, { replace: true });
    } });
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-violet-600">Team settings</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Workspace management</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Manage your spaces, invite teammates, and join a team with an invitation link.</p>
        </div>
        <button onClick={() => setShowCreateWorkspace((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"><Plus size={17}/>New workspace</button>
      </header>

      {showCreateWorkspace && <form onSubmit={submitNewWorkspace} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Create a workspace</h2><p className="mt-1 text-sm text-slate-500">Your new space will be selected when it’s ready.</p></div><button type="button" onClick={() => setShowCreateWorkspace(false)} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={17}/></button></div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input autoFocus value={newWorkspaceName} onChange={(event) => setNewWorkspaceName(event.target.value)} maxLength={100} placeholder="Workspace name" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/><button disabled={!newWorkspaceName.trim() || createWorkspace.isPending} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{createWorkspace.isPending ? "Creating…" : "Create workspace"}</button></div>
        {createWorkspace.isError && <p role="alert" className="mt-3 text-sm text-rose-600">{errorMessage(createWorkspace.error)}</p>}
      </form>}

      <section className="space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Your workspaces</h2><p className="mt-1 text-sm text-slate-500">Choose which workspace is active, or update its name.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{workspaces.length} {workspaces.length === 1 ? "workspace" : "workspaces"}</span></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {workspaces.map((workspace) => {
            const isCurrent = workspace.id === currentWorkspace?.id;
            const canEdit = workspace.role === "OWNER" || workspace.role === "ADMIN";
            const canDelete = workspace.role === "OWNER";
            return <article key={workspace.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition ${isCurrent ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isCurrent ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}><Building2 size={20}/></div>
                <div className="min-w-0 flex-1">
                  {editingId === workspace.id ? <form onSubmit={submitWorkspaceName} className="flex flex-wrap gap-2"><input autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={100} aria-label="Workspace name" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400"/><button disabled={!editName.trim() || updateWorkspace.isPending} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white">Save</button><button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600">Cancel</button></form> : <><h3 className="truncate font-semibold text-slate-900">{workspace.name}</h3><div className="mt-1.5 flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{roleLabel(workspace.role)}</span>{isCurrent && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Active workspace</span>}</div></>}
                  {editingId === workspace.id && updateWorkspace.isError && <p role="alert" className="mt-2 text-xs text-rose-600">{errorMessage(updateWorkspace.error)}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {!isCurrent && <button onClick={() => setCurrentWorkspace(workspace)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Switch to workspace <ArrowRight size={13}/></button>}
                {canEdit && editingId !== workspace.id && <button onClick={() => { setEditingId(workspace.id); setEditName(workspace.name); updateWorkspace.reset(); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Pencil size={13}/>Rename</button>}
                {canDelete && <button onClick={() => { if (window.confirm(`Delete “${workspace.name}” and all its workspace data? This cannot be undone.`)) deleteWorkspace.mutate(workspace.id); }} disabled={deleteWorkspace.isPending} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13}/>Delete</button>}
              </div>
              {deleteWorkspace.isError && <p role="alert" className="mt-2 text-xs text-rose-600">{errorMessage(deleteWorkspace.error)}</p>}
            </article>;
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><MailPlus size={18}/></span><div><h2 className="font-semibold text-slate-900">Invite teammates</h2><p className="mt-1 text-sm text-slate-500">Create a secure, one-time invite link for {currentWorkspace?.name ?? "this workspace"}.</p></div></div>
          {permissions.canInviteMember ? <>
            <form onSubmit={submitInvite} className="mt-5 flex flex-col gap-2 sm:flex-row"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.com" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/><button disabled={!email.trim() || inviteMember.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{inviteMember.isPending ? <LoaderCircle className="animate-spin" size={16}/> : <Link2 size={16}/>}Create invite link</button></form>
            {inviteMember.isError && <p role="alert" className="mt-3 text-sm text-rose-600">{errorMessage(inviteMember.error)}</p>}
            {createdInvite && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-900">Invite link ready</p><p className="mt-0.5 text-xs text-emerald-800">Share with {createdInvite.email}. It expires in 24 hours and is limited to that email address.</p></div><div className="flex gap-2"><a href={`mailto:${encodeURIComponent(createdInvite.email)}?subject=${encodeURIComponent(`Join ${currentWorkspace?.name ?? "our workspace"} on CollabSpace`)}&body=${encodeURIComponent(`You have been invited to ${currentWorkspace?.name ?? "our workspace"}. Sign in or create an account, then open this invitation link:\n\n${inviteLink}`)}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm"><Mail size={14}/>Email invite</a><button onClick={copyInvite} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm">{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copied" : "Copy link"}</button></div></div><input readOnly value={inviteLink} onFocus={(event) => event.currentTarget.select()} aria-label="Invitation link" className="mt-3 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-600"/>{copyError && <p className="mt-2 text-xs text-amber-800">Clipboard access was blocked. Select and copy the link above.</p>}</div>}
          </> : <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Only workspace owners and admins can invite people.</p>}
          {permissions.canInviteMember && <div className="mt-6 border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Recent invitations</h3>{invitationsQuery.data && <span className="text-xs text-slate-400">{invitationsQuery.data.length} total</span>}</div>
            {invitationsQuery.isLoading ? <p className="text-sm text-slate-400">Loading invitations…</p> : invitationsQuery.isError ? <p role="alert" className="text-sm text-rose-600">{errorMessage(invitationsQuery.error)}</p> : invitationsQuery.data?.length ? <ul className="divide-y divide-slate-100">{invitationsQuery.data.map((invite) => <li key={invite.id} className="flex items-center gap-3 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Users size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{invite.email}</span><span className="text-xs text-slate-400">{invite.status === "PENDING" ? `Expires ${new Date(invite.expiresAt).toLocaleDateString()}` : invite.status === "EXPIRED" ? "Expired" : "Accepted"}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${invite.status === "PENDING" ? "bg-amber-50 text-amber-700" : invite.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{roleLabel(invite.status)}</span>{invite.status !== "ACCEPTED" && <button onClick={() => revokeInvite.mutate(invite.id)} disabled={revokeInvite.isPending} aria-label={`Revoke invitation for ${invite.email}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={15}/></button>}</li>)}</ul> : <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No invitations yet. Create a link above to bring someone in.</p>}
            {revokeInvite.isError && <p role="alert" className="mt-2 text-xs text-rose-600">{errorMessage(revokeInvite.error)}</p>}
          </div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Users size={18}/></span><div><h2 className="font-semibold text-slate-900">Join a workspace</h2><p className="mt-1 text-sm text-slate-500">Accept a teammate’s invitation and switch into the workspace right away.</p></div></div>
          <form onSubmit={submitAcceptance} className="mt-5 space-y-3"><label htmlFor="workspace-invite-token" className="block text-xs font-semibold text-slate-700">Invitation link or token<input id="workspace-invite-token" value={inviteToken} onChange={(event) => { const value = event.target.value.trim(); try { setInviteToken(new URL(value).searchParams.get("token") ?? value); } catch { setInviteToken(value); } }} placeholder="Paste the invite link or token" className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"/></label><button disabled={!inviteToken.trim() || acceptInvitation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{acceptInvitation.isPending ? <LoaderCircle className="animate-spin" size={16}/> : <ArrowRight size={16}/>}Join workspace</button></form>
          {acceptInvitation.isError && <p role="alert" className="mt-3 text-sm text-rose-600">{errorMessage(acceptInvitation.error)}</p>}
          {acceptInvitation.isSuccess && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Invitation accepted. You’re now in the new workspace.</p>}
          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">Invitations are tied to your signed-in email and expire after 24 hours.</p>
        </div>
      </section>
    </div>
  );
}
