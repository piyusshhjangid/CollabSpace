import { createHash, randomBytes } from "node:crypto";
import { badRequest, forbidden, notFound, serviceUnavailable } from "../lib/AppError.js";
import { encryptIntegrationCredentials, decryptIntegrationCredentials } from "../lib/integration-crypto.js";
import { prisma } from "../db/prisma.js";
import { createOAuthState, consumeOAuthState, deleteIntegration as deleteIntegrationRow, enqueueIntegrationSync, findIntegration, listIntegrationEvents, listIntegrations, recordIntegrationEvents, retryIntegrationSyncJob, saveIntegrationCredentials, upsertIntegration, type IntegrationRow } from "../repositories/integration.repository.js";
import { findWorkspaceMembership } from "../repositories/workspace.repository.js";
import { writeAuditLog } from "./audit.service.js";
import { StartIntegrationSchema } from "../schemas/intelligence.schema.js";

export const PROVIDERS = ["JIRA", "LINEAR", "GITLAB", "SLACK"] as const;
export type Provider = typeof PROVIDERS[number];
interface ProviderSettings { clientId: string; clientSecret: string; redirectUri: string; authorizeUrl: string; tokenUrl: string; scopes: string; }
interface OAuthCredentials { accessToken: string; refreshToken?: string; expiresAt?: string; scope?: string; tokenType?: string; }
interface OAuthTokenResponse { access_token?: unknown; refresh_token?: unknown; expires_in?: unknown; scope?: unknown; token_type?: unknown; ok?: unknown; error?: unknown; team?: { id?: unknown; name?: unknown }; authed_user?: { id?: unknown }; }
interface GitLabPipeline { id: number; iid?: number; project_id: number; ref?: string; status?: string; web_url?: string; updated_at?: string; created_at?: string; user?: { name?: string }; }

function provider(value: string): Provider {
  if ((PROVIDERS as readonly string[]).includes(value.toUpperCase())) return value.toUpperCase() as Provider;
  throw badRequest("Unsupported integration provider");
}

function publicServerUrl() {
  const base = process.env.PUBLIC_SERVER_URL || "http://localhost:5000";
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("invalid");
    return url.origin;
  } catch {
    throw serviceUnavailable("PUBLIC_SERVER_URL must be a public HTTPS origin (localhost is allowed for development)");
  }
}

function settingsFor(kind: Provider): ProviderSettings {
  const prefix = kind;
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  const redirectUri = process.env[`${prefix}_REDIRECT_URI`] || `${publicServerUrl()}/api/integrations/oauth/${kind.toLowerCase()}/callback`;
  const shared = { clientId: clientId ?? "", clientSecret: clientSecret ?? "", redirectUri };
  switch (kind) {
    case "JIRA": return { ...shared, authorizeUrl: "https://auth.atlassian.com/authorize", tokenUrl: "https://auth.atlassian.com/oauth/token", scopes: "read:jira-work read:jira-user offline_access" };
    case "LINEAR": return { ...shared, authorizeUrl: "https://linear.app/oauth/authorize", tokenUrl: "https://api.linear.app/oauth/token", scopes: "read" };
    case "GITLAB": return { ...shared, authorizeUrl: `${gitlabBaseUrl()}/oauth/authorize`, tokenUrl: `${gitlabBaseUrl()}/oauth/token`, scopes: "read_api read_user" };
    case "SLACK": return { ...shared, authorizeUrl: "https://slack.com/oauth/v2/authorize", tokenUrl: "https://slack.com/api/oauth.v2.access", scopes: "chat:write" };
  }
}

function gitlabBaseUrl() {
  const value = process.env.GITLAB_BASE_URL || "https://gitlab.com";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error("invalid");
    return url.origin;
  } catch {
    throw serviceUnavailable("GITLAB_BASE_URL must be HTTPS (localhost is allowed for development)");
  }
}

function providerReady(kind: Provider) {
  const settings = settingsFor(kind);
  const cryptoReady = Boolean(process.env.INTEGRATION_ENCRYPTION_KEY && process.env.INTEGRATION_ENCRYPTION_KEY.length >= 32);
  return Boolean(settings.clientId && settings.clientSecret && cryptoReady);
}

export function getAvailableIntegrations() {
  return PROVIDERS.map((kind) => {
    const settings = settingsFor(kind);
    return { provider: kind, name: kind === "JIRA" ? "Jira" : kind === "GITLAB" ? "GitLab" : kind[0] + kind.slice(1).toLowerCase(), configured: providerReady(kind), callbackUrl: settings.redirectUri, scopes: settings.scopes, purpose: kind === "SLACK" ? "Send a project delivery digest to a Slack channel." : "Import recent work items as read-only project activity." };
  });
}

export async function startProviderAuthorization(workspaceId: string, userId: string, kindInput: string, body: unknown) {
  const kind = provider(kindInput);
  const settings = settingsFor(kind);
  if (!providerReady(kind)) throw serviceUnavailable(`Configure ${kind}_CLIENT_ID, ${kind}_CLIENT_SECRET, INTEGRATION_ENCRYPTION_KEY, and the registered callback URL before connecting ${kind}`);
  const parsed = StartIntegrationSchema.parse(body);
  const project = await prisma.projects.findFirst({ where: { id: parsed.projectId, workspace_id: workspaceId }, select: { id: true } });
  if (!project) throw badRequest("Choose a project in this workspace");
  if (kind === "SLACK" && !parsed.channelId) throw badRequest("Enter a Slack channel ID before connecting");
  if (kind === "JIRA" && parsed.externalRef && !/^[A-Z][A-Z0-9_]{0,29}$/.test(parsed.externalRef)) throw badRequest("Jira project key must use uppercase letters, numbers, or underscores");
  if (kind === "LINEAR" && parsed.externalRef && !/^[0-9a-f-]{16,64}$/i.test(parsed.externalRef)) throw badRequest("Linear team reference should be a team ID");
  if (kind === "GITLAB" && parsed.externalRef && (!/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(parsed.externalRef) || parsed.externalRef.split("/").some((part: string) => part === ".." || part === "."))) throw badRequest("GitLab project reference must be a project ID or a safe group/project path");
  const state = randomBytes(32).toString("base64url");
  const stateHash = createHash("sha256").update(state).digest("hex");
  const providerConfig = { externalRef: parsed.externalRef ?? null, channelId: parsed.channelId ?? null };
  await createOAuthState({ stateHash, workspaceId, projectId: project.id, userId, provider: kind, providerConfig, expiresAt: new Date(Date.now() + 10 * 60_000) });
  const url = new URL(settings.authorizeUrl);
  url.searchParams.set("client_id", settings.clientId);
  url.searchParams.set("redirect_uri", settings.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (kind === "JIRA") {
    url.searchParams.set("audience", "api.atlassian.com");
    url.searchParams.set("scope", settings.scopes);
    url.searchParams.set("prompt", "consent");
  } else {
    url.searchParams.set("scope", settings.scopes);
  }
  return { authorizationUrl: url.toString(), callbackUrl: settings.redirectUri, provider: kind };
}

async function providerJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(15_000), redirect: "error" }); }
  catch { throw new Error("PROVIDER_NETWORK_ERROR"); }
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error("PROVIDER_INVALID_RESPONSE"); }
  if (!response.ok || !body || typeof body !== "object") throw new Error(`PROVIDER_HTTP_${response.status}`);
  const record = body as Record<string, unknown>;
  if (record.ok === false) throw new Error(typeof record.error === "string" ? `PROVIDER_${record.error.toUpperCase()}` : "PROVIDER_REQUEST_FAILED");
  return body as T;
}

function requireToken(payload: OAuthTokenResponse) {
  if (typeof payload.access_token !== "string" || !payload.access_token) throw new Error("PROVIDER_TOKEN_MISSING");
  const expires = typeof payload.expires_in === "number" ? new Date(Date.now() + payload.expires_in * 1000).toISOString() : undefined;
  return {
    accessToken: payload.access_token,
    ...(typeof payload.refresh_token === "string" ? { refreshToken: payload.refresh_token } : {}),
    ...(expires ? { expiresAt: expires } : {}),
    ...(typeof payload.scope === "string" ? { scope: payload.scope } : {}),
    ...(typeof payload.token_type === "string" ? { tokenType: payload.token_type } : {}),
  } satisfies OAuthCredentials;
}

async function exchangeCode(kind: Provider, code: string, settings: ProviderSettings): Promise<OAuthTokenResponse> {
  if (kind === "JIRA") return providerJson<OAuthTokenResponse>(settings.tokenUrl, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ grant_type: "authorization_code", client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: settings.redirectUri }) });
  const form = new URLSearchParams({ grant_type: "authorization_code", client_id: settings.clientId, client_secret: settings.clientSecret, code, redirect_uri: settings.redirectUri });
  return providerJson<OAuthTokenResponse>(settings.tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: form });
}

async function identifyAccount(kind: Provider, accessToken: string) {
  if (kind === "JIRA") {
    const sites = await providerJson<Array<{ id?: string; name?: string; url?: string }>>("https://api.atlassian.com/oauth/token/accessible-resources", { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" } });
    const site = sites[0];
    if (!site?.id) throw new Error("PROVIDER_NO_ACCESSIBLE_JIRA_SITE");
    return { accountId: site.id, displayName: site.name || site.url || "Jira site", baseUrl: typeof site.url === "string" ? site.url : null, config: { cloudId: site.id, siteUrl: site.url ?? null } };
  }
  if (kind === "LINEAR") {
    const response = await providerJson<{ data?: { viewer?: { id?: string; name?: string; organization?: { id?: string; name?: string } } } }>("https://api.linear.app/graphql", { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ query: "query { viewer { id name organization { id name } } }" }) });
    const viewer = response.data?.viewer;
    if (!viewer?.id) throw new Error("PROVIDER_IDENTITY_UNAVAILABLE");
    return { accountId: viewer.organization?.id || viewer.id, displayName: viewer.organization?.name || viewer.name || "Linear workspace", baseUrl: "https://linear.app", config: { connectedUser: viewer.name ?? null } };
  }
  if (kind === "GITLAB") {
    const identity = await providerJson<{ id?: number; username?: string; name?: string }>(`${gitlabBaseUrl()}/api/v4/user`, { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" } });
    if (!identity.id) throw new Error("PROVIDER_IDENTITY_UNAVAILABLE");
    return { accountId: String(identity.id), displayName: identity.name || identity.username || "GitLab account", baseUrl: gitlabBaseUrl(), config: { username: identity.username ?? null } };
  }
  const payload = await providerJson<OAuthTokenResponse>("https://slack.com/api/auth.test", { headers: { authorization: `Bearer ${accessToken}` } });
  const identity = payload as OAuthTokenResponse & { team_id?: string; team?: { id?: string; name?: string }; user_id?: string };
  const accountId = identity.team?.id || identity.team_id;
  if (!accountId) throw new Error("PROVIDER_IDENTITY_UNAVAILABLE");
  return { accountId, displayName: identity.team?.name || "Slack workspace", baseUrl: "https://slack.com", config: { botUserId: identity.user_id ?? null } };
}

export async function completeProviderAuthorization(kindInput: string, code: string, state: string) {
  const kind = provider(kindInput);
  const stateHash = createHash("sha256").update(state).digest("hex");
  const record = await consumeOAuthState(stateHash, kind);
  if (!record) throw badRequest("This connection request expired or was already used. Start the connection again.");
  const settings = settingsFor(kind);
  if (!providerReady(kind)) throw serviceUnavailable("The integration provider is no longer configured on this server");
  const token = requireToken(await exchangeCode(kind, code, settings));
  const identity = await identifyAccount(kind, token.accessToken);
  const savedConfig = { ...(identity.config as Record<string, unknown>), ...(record.provider_config as Record<string, unknown> ?? {}), scopes: token.scope ?? settings.scopes };
  const saved = await upsertIntegration({ workspaceId: record.workspace_id, projectId: record.project_id, userId: record.user_id, provider: kind, accountId: identity.accountId, displayName: identity.displayName, baseUrl: identity.baseUrl, ciphertext: encryptIntegrationCredentials(token), config: savedConfig });
  await writeAuditLog({ workspaceId: record.workspace_id, actorId: record.user_id, action: "EXTERNAL_INTEGRATION_CONNECTED", targetType: "EXTERNAL_INTEGRATION", targetId: saved.id, metadata: { provider: kind, projectId: saved.project_id } });
  return { workspaceId: record.workspace_id, integrationId: saved.id };
}

function configRecord(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }

async function refreshCredentials(kind: Provider, workspaceId: string, integration: IntegrationRow, credentials: OAuthCredentials) {
  if (!credentials.expiresAt || new Date(credentials.expiresAt).getTime() > Date.now() + 120_000) return credentials;
  if (!credentials.refreshToken) throw new Error("INTEGRATION_REAUTH_REQUIRED");
  const settings = settingsFor(kind);
  let payload: OAuthTokenResponse;
  if (kind === "JIRA") {
    payload = await providerJson<OAuthTokenResponse>(settings.tokenUrl, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ grant_type: "refresh_token", client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: credentials.refreshToken }) });
  } else {
    const form = new URLSearchParams({ grant_type: "refresh_token", client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: credentials.refreshToken });
    payload = await providerJson<OAuthTokenResponse>(settings.tokenUrl, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: form });
  }
  const refreshed = requireToken(payload);
  const refreshToken = refreshed.refreshToken ?? credentials.refreshToken;
  const expiresAt = refreshed.expiresAt ?? credentials.expiresAt;
  const scope = refreshed.scope ?? credentials.scope;
  const tokenType = refreshed.tokenType ?? credentials.tokenType;
  const next: OAuthCredentials = {
    accessToken: refreshed.accessToken,
    ...(refreshToken ? { refreshToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(scope ? { scope } : {}),
    ...(tokenType ? { tokenType } : {}),
  };
  await saveIntegrationCredentials(integration.id, workspaceId, encryptIntegrationCredentials(next), "ACTIVE");
  return next;
}

async function getApiJSON<T>(url: string, token: string) {
  return providerJson<T>(url, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
}

async function syncProvider(integration: IntegrationRow, credentials: OAuthCredentials) {
  const config = configRecord(integration.config);
  if (integration.provider === "JIRA") {
    const cloudId = typeof config.cloudId === "string" ? config.cloudId : integration.external_account_id;
    const projectKey = typeof config.externalRef === "string" ? config.externalRef : null;
    const jql = projectKey ? `project = ${projectKey} ORDER BY updated DESC` : "ORDER BY updated DESC";
    const url = new URL(`https://api.atlassian.com/ex/jira/${encodeURIComponent(cloudId)}/rest/api/3/search/jql`);
    url.searchParams.set("jql", jql); url.searchParams.set("maxResults", "100"); url.searchParams.set("fields", "summary,status,updated,assignee");
    const data = await getApiJSON<{ issues?: Array<{ id: string; key: string; fields?: { summary?: string; status?: { name?: string }; updated?: string; assignee?: { displayName?: string } } }> }>(url.toString(), credentials.accessToken);
    const issues = data.issues ?? [];
    const events = issues.map((issue) => ({ externalId: `jira:${issue.id}:${issue.fields?.updated ?? ""}`, type: "ISSUE_SYNC", actor: issue.fields?.assignee?.displayName ?? null, title: `${issue.key} · ${issue.fields?.summary ?? "Untitled issue"}`, body: issue.fields?.status?.name ?? null, url: integration.base_url ? `${integration.base_url}/browse/${encodeURIComponent(issue.key)}` : null, occurredAt: new Date(issue.fields?.updated ?? Date.now()), metadata: { key: issue.key, status: issue.fields?.status?.name ?? null } }));
    return { count: await recordIntegrationEvents(integration, events), kind: "read_only_issue_import" };
  }
  if (integration.provider === "LINEAR") {
    const teamId = typeof config.externalRef === "string" ? config.externalRef : null;
    const query = teamId
      ? "query($teamId: String!) { issues(first: 100, filter: { team: { id: { eq: $teamId } } }) { nodes { id identifier title url updatedAt creator { name } state { name } } } }"
      : "query { issues(first: 100) { nodes { id identifier title url updatedAt creator { name } state { name } } } }";
    const data = await providerJson<{ data?: { issues?: { nodes?: Array<{ id: string; identifier?: string; title?: string; url?: string; updatedAt?: string; creator?: { name?: string }; state?: { name?: string } }> } }; errors?: unknown[] }>("https://api.linear.app/graphql", { method: "POST", headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ query, ...(teamId ? { variables: { teamId } } : {}) }) });
    if (data.errors?.length) throw new Error("PROVIDER_GRAPHQL_QUERY_FAILED");
    const issues = data.data?.issues?.nodes ?? [];
    const events = issues.map((issue) => ({ externalId: `linear:${issue.id}:${issue.updatedAt ?? ""}`, type: "ISSUE_SYNC", actor: issue.creator?.name ?? null, title: `${issue.identifier ? `${issue.identifier} · ` : ""}${issue.title ?? "Untitled issue"}`, body: issue.state?.name ?? null, url: issue.url ?? null, occurredAt: new Date(issue.updatedAt ?? Date.now()), metadata: { identifier: issue.identifier ?? null, state: issue.state?.name ?? null } }));
    return { count: await recordIntegrationEvents(integration, events), kind: "read_only_issue_import" };
  }
  if (integration.provider === "GITLAB") {
    const base = integration.base_url || gitlabBaseUrl();
    const ref = typeof config.externalRef === "string" ? config.externalRef : null;
    const scopedPath = ref ? `/api/v4/projects/${encodeURIComponent(ref)}` : "/api/v4";
    const issuesUrl = new URL(`${scopedPath}/issues`, base);
    issuesUrl.searchParams.set("per_page", "100"); issuesUrl.searchParams.set("order_by", "updated_at"); issuesUrl.searchParams.set("sort", "desc");
    if (!ref) issuesUrl.searchParams.set("scope", "assigned_to_me");
    const pipelineRequest: Promise<GitLabPipeline[]> = ref ? (() => {
      const pipelinesUrl = new URL(`${scopedPath}/pipelines`, base);
      pipelinesUrl.searchParams.set("per_page", "100"); pipelinesUrl.searchParams.set("order_by", "updated_at"); pipelinesUrl.searchParams.set("sort", "desc");
      return getApiJSON<GitLabPipeline[]>(pipelinesUrl.toString(), credentials.accessToken);
    })() : Promise.resolve([]);
    const [issues, pipelines] = await Promise.all([
      getApiJSON<Array<{ id: number; iid: number; project_id: number; title: string; web_url?: string; updated_at?: string; state?: string; assignee?: { name?: string } }>>(issuesUrl.toString(), credentials.accessToken),
      pipelineRequest,
    ]);
    const issueEvents = issues.map((issue) => ({ externalId: `gitlab:issue:${issue.id}:${issue.updated_at ?? ""}`, type: "ISSUE_SYNC", actor: issue.assignee?.name ?? null, title: `#${issue.iid} · ${issue.title}`, body: issue.state ?? null, url: issue.web_url ?? null, occurredAt: new Date(issue.updated_at ?? Date.now()), metadata: { issueId: issue.iid, projectId: issue.project_id, state: issue.state ?? null } }));
    const pipelineEvents = pipelines.map((pipeline) => ({ externalId: `gitlab:pipeline:${pipeline.project_id}:${pipeline.id}:${pipeline.updated_at ?? ""}`, type: "PIPELINE_SYNC", actor: pipeline.user?.name ?? null, title: `Pipeline ${pipeline.iid ? `#${pipeline.iid}` : `#${pipeline.id}`}${pipeline.ref ? ` · ${pipeline.ref}` : ""}`, body: pipeline.status ?? null, url: pipeline.web_url ?? null, occurredAt: new Date(pipeline.updated_at ?? pipeline.created_at ?? Date.now()), metadata: { pipelineId: pipeline.id, projectId: pipeline.project_id, ref: pipeline.ref ?? null, status: pipeline.status ?? null } }));
    return { count: await recordIntegrationEvents(integration, [...issueEvents, ...pipelineEvents]), kind: "read_only_issues_and_pipelines" };
  }
  const channelId = typeof config.channelId === "string" ? config.channelId : "";
  if (!channelId) throw new Error("SLACK_CHANNEL_REQUIRED");
  const project = integration.project_id ? await prisma.projects.findFirst({ where: { id: integration.project_id, workspace_id: integration.workspace_id }, select: { name: true, id: true } }) : null;
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const tasks = await prisma.tasks.findMany({ where: { project_id: project.id, workspace_id: integration.workspace_id }, select: { title: true, status: true, due_date: true }, orderBy: [{ due_date: "asc" }, { created_at: "asc" }], take: 40 });
  const open = tasks.filter((task) => !["DONE", "COMPLETED"].includes(task.status.toUpperCase()));
  const blocked = open.filter((task) => task.status.toUpperCase() === "BLOCKED");
  const lines = [`CollabSpace delivery update — ${project.name}`, `${open.length} open tasks · ${blocked.length} blocked · ${tasks.length - open.length} complete`, ...blocked.slice(0, 5).map((task) => `Blocked: ${task.title}`), ...open.filter((task) => task.due_date && task.due_date < new Date()).slice(0, 5).map((task) => `Overdue: ${task.title}`)];
  const result = await providerJson<{ ok?: boolean; error?: string }>("https://slack.com/api/chat.postMessage", { method: "POST", headers: { authorization: `Bearer ${credentials.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ channel: channelId, text: lines.join("\n"), mrkdwn: false, unfurl_links: false, unfurl_media: false }) });
  if (result.ok !== true) throw new Error("PROVIDER_MESSAGE_NOT_SENT");
  await prisma.$executeRaw`UPDATE external_integrations SET last_synced_at = now(), status = 'ACTIVE', updated_at = now() WHERE id = ${integration.id}::uuid AND workspace_id = ${integration.workspace_id}::uuid`;
  return { count: 1, kind: "slack_digest_sent" };
}

export async function runIntegrationSync(job: { id: string; workspace_id: string; integration_id: string; attempts: number }) {
  const integration = await findIntegration(job.workspace_id, job.integration_id);
  try {
    if (!integration || !integration.credentials_ciphertext) throw new Error("INTEGRATION_NOT_FOUND");
    const kind = provider(integration.provider);
    let credentials = decryptIntegrationCredentials<OAuthCredentials>(integration.credentials_ciphertext);
    credentials = await refreshCredentials(kind, job.workspace_id, integration, credentials);
    const result = await syncProvider(integration, credentials);
    await writeAuditLog({ workspaceId: job.workspace_id, actorId: integration.created_by, action: "EXTERNAL_INTEGRATION_SYNCED", targetType: "EXTERNAL_INTEGRATION", targetId: integration.id, metadata: { provider: kind, eventCount: result.count, kind: result.kind } });
    return result;
  } catch (error) {
    const errorCode = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message.slice(0, 100) : "INTEGRATION_SYNC_FAILED";
    await retryIntegrationSyncJob(job.id, job.workspace_id, job.integration_id, job.attempts, errorCode);
    throw error;
  }
}

export async function listWorkspaceIntegrations(workspaceId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  return listIntegrations(workspaceId);
}

export async function queueIntegrationSync(workspaceId: string, integrationId: string, userId: string) {
  const integration = await findIntegration(workspaceId, integrationId);
  if (!integration) throw notFound("Integration not found in this workspace");
  const job = await enqueueIntegrationSync(workspaceId, integrationId, userId);
  if (!job) throw badRequest("This integration is paused or unavailable");
  await writeAuditLog({ workspaceId, actorId: userId, action: "EXTERNAL_INTEGRATION_SYNC_QUEUED", targetType: "EXTERNAL_INTEGRATION", targetId: integrationId, metadata: { provider: integration.provider, jobId: job.id } });
  return job;
}

export async function getProjectIntegrationEvents(workspaceId: string, projectId: string, userId: string) {
  if (!(await findWorkspaceMembership(workspaceId, userId))) throw forbidden("You are not a member of this workspace");
  const project = await prisma.projects.findFirst({ where: { id: projectId, workspace_id: workspaceId }, select: { id: true } });
  if (!project) throw notFound("Project not found in this workspace");
  return listIntegrationEvents(workspaceId, projectId);
}

export async function removeWorkspaceIntegration(workspaceId: string, integrationId: string, userId: string) {
  const integration = await findIntegration(workspaceId, integrationId);
  if (!integration) throw notFound("Integration not found in this workspace");
  await deleteIntegrationRow(workspaceId, integrationId);
  await writeAuditLog({ workspaceId, actorId: userId, action: "EXTERNAL_INTEGRATION_REMOVED", targetType: "EXTERNAL_INTEGRATION", targetId: integrationId, metadata: { provider: integration.provider } });
  return { id: integrationId };
}

export async function handleOAuthCallback(kindInput: string, code: string, state: string) {
  const clientBase = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  try {
    const result = await completeProviderAuthorization(kindInput, code, state);
    const target = new URL("/insights", clientBase); target.searchParams.set("tab", "integrations"); target.searchParams.set("integration", "connected"); target.searchParams.set("workspaceId", result.workspaceId);
    return target.toString();
  } catch (error) {
    console.error("Provider OAuth callback failed", error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "OAUTH_CALLBACK_FAILED");
    const target = new URL("/insights", clientBase); target.searchParams.set("tab", "integrations"); target.searchParams.set("integration", "error");
    return target.toString();
  }
}
