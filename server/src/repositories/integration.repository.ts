import { prisma } from "../db/prisma.js";

export interface IntegrationRow {
  id: string;
  workspace_id: string;
  project_id: string | null;
  created_by: string;
  provider: string;
  external_account_id: string;
  display_name: string;
  base_url: string | null;
  credentials_ciphertext: string | null;
  config: unknown;
  status: string;
  last_synced_at: Date | null;
  created_at: Date;
}

export async function createOAuthState(input: { stateHash: string; workspaceId: string; projectId: string | null; userId: string; provider: string; providerConfig: unknown; expiresAt: Date }) {
  await prisma.$executeRaw`
    INSERT INTO integration_oauth_states (state_hash, workspace_id, project_id, user_id, provider, provider_config, expires_at)
    VALUES (${input.stateHash}, ${input.workspaceId}::uuid, ${input.projectId}::uuid, ${input.userId}::uuid, ${input.provider}, ${JSON.stringify(input.providerConfig)}::jsonb, ${input.expiresAt})
  `;
}

export async function consumeOAuthState(stateHash: string, provider: string) {
  const rows = await prisma.$queryRaw<Array<{ workspace_id: string; project_id: string | null; user_id: string; provider: string; provider_config: unknown }>>`
    UPDATE integration_oauth_states SET consumed_at = now()
    WHERE state_hash = ${stateHash} AND provider = ${provider} AND consumed_at IS NULL AND expires_at > now()
    RETURNING workspace_id, project_id, user_id, provider, provider_config
  `;
  return rows[0] ?? null;
}

export async function upsertIntegration(input: { workspaceId: string; projectId: string | null; userId: string; provider: string; accountId: string; displayName: string; baseUrl: string | null; ciphertext: string; config: unknown }) {
  const rows = await prisma.$queryRaw<Array<Pick<IntegrationRow, "id" | "workspace_id" | "project_id" | "provider" | "external_account_id" | "display_name" | "base_url" | "config" | "status" | "last_synced_at" | "created_at">>>`
    INSERT INTO external_integrations (workspace_id, project_id, created_by, provider, external_account_id, display_name, base_url, credentials_ciphertext, config, status)
    VALUES (${input.workspaceId}::uuid, ${input.projectId}::uuid, ${input.userId}::uuid, ${input.provider}, ${input.accountId}, ${input.displayName}, ${input.baseUrl}, ${input.ciphertext}, ${JSON.stringify(input.config)}::jsonb, 'ACTIVE')
    ON CONFLICT (workspace_id, provider, external_account_id) DO UPDATE SET
      project_id = EXCLUDED.project_id, created_by = EXCLUDED.created_by, display_name = EXCLUDED.display_name,
      base_url = EXCLUDED.base_url, credentials_ciphertext = EXCLUDED.credentials_ciphertext,
      config = EXCLUDED.config, status = 'ACTIVE', updated_at = now()
    RETURNING id, workspace_id, project_id, provider, external_account_id, display_name, base_url, config, status, last_synced_at, created_at
  `;
  return rows[0]!;
}

export async function listIntegrations(workspaceId: string) {
  return prisma.$queryRaw<Array<{ id: string; project_id: string | null; provider: string; external_account_id: string; display_name: string; base_url: string | null; config: unknown; status: string; last_synced_at: Date | null; created_at: Date; event_count: number; latest_job_status: string | null }>>`
    SELECT i.id, i.project_id, i.provider, i.external_account_id, i.display_name, i.base_url, i.config, i.status, i.last_synced_at, i.created_at,
      (SELECT count(*)::int FROM integration_events e WHERE e.integration_id = i.id) AS event_count,
      (SELECT j.status FROM integration_sync_jobs j WHERE j.integration_id = i.id ORDER BY j.created_at DESC LIMIT 1) AS latest_job_status
    FROM external_integrations i WHERE i.workspace_id = ${workspaceId}::uuid
    ORDER BY i.created_at DESC
  `;
}

export async function findIntegration(workspaceId: string, integrationId: string) {
  const rows = await prisma.$queryRaw<IntegrationRow[]>`
    SELECT id, workspace_id, project_id, created_by, provider, external_account_id, display_name, base_url, credentials_ciphertext, config, status, last_synced_at, created_at
    FROM external_integrations WHERE id = ${integrationId}::uuid AND workspace_id = ${workspaceId}::uuid
  `;
  return rows[0] ?? null;
}

export async function saveIntegrationCredentials(integrationId: string, workspaceId: string, ciphertext: string, status: string) {
  return prisma.$executeRaw`
    UPDATE external_integrations SET credentials_ciphertext = ${ciphertext}, status = ${status}, updated_at = now()
    WHERE id = ${integrationId}::uuid AND workspace_id = ${workspaceId}::uuid
  `;
}

export async function recordIntegrationEvents(integration: IntegrationRow, events: Array<{ externalId: string; type: string; actor?: string | null; title: string; body?: string | null; url?: string | null; occurredAt: Date; metadata: unknown }>) {
  let count = 0;
  for (const event of events) {
    const result = await prisma.$executeRaw`
      INSERT INTO integration_events (workspace_id, project_id, integration_id, provider, external_id, event_type, actor, title, body, url, occurred_at, metadata)
      VALUES (${integration.workspace_id}::uuid, ${integration.project_id}::uuid, ${integration.id}::uuid, ${integration.provider}, ${event.externalId}, ${event.type}, ${event.actor ?? null}, ${event.title}, ${event.body ?? null}, ${event.url ?? null}, ${event.occurredAt}, ${JSON.stringify(event.metadata)}::jsonb)
      ON CONFLICT (integration_id, external_id) DO UPDATE SET event_type = EXCLUDED.event_type, actor = EXCLUDED.actor, title = EXCLUDED.title, body = EXCLUDED.body, url = EXCLUDED.url, occurred_at = EXCLUDED.occurred_at, metadata = EXCLUDED.metadata
    `;
    count += Number(result > 0);
  }
  await prisma.$executeRaw`UPDATE external_integrations SET last_synced_at = now(), status = 'ACTIVE', updated_at = now() WHERE id = ${integration.id}::uuid AND workspace_id = ${integration.workspace_id}::uuid`;
  return count;
}

export async function listIntegrationEvents(workspaceId: string, projectId: string) {
  return prisma.$queryRaw<Array<{ id: string; provider: string; event_type: string; external_id: string; actor: string | null; title: string; body: string | null; url: string | null; occurred_at: Date; created_at: Date }>>`
    SELECT id, provider, event_type, external_id, actor, title, body, url, occurred_at, created_at
    FROM integration_events WHERE workspace_id = ${workspaceId}::uuid AND project_id = ${projectId}::uuid
    ORDER BY occurred_at DESC LIMIT 100
  `;
}

export async function deleteIntegration(workspaceId: string, integrationId: string) {
  return prisma.$executeRaw`DELETE FROM external_integrations WHERE id = ${integrationId}::uuid AND workspace_id = ${workspaceId}::uuid`;
}

export async function enqueueIntegrationSync(workspaceId: string, integrationId: string, userId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string; status: string; created_at: Date }>>`
    INSERT INTO integration_sync_jobs (workspace_id, integration_id, requested_by)
    SELECT ${workspaceId}::uuid, i.id, ${userId}::uuid FROM external_integrations i
    WHERE i.id = ${integrationId}::uuid AND i.workspace_id = ${workspaceId}::uuid AND i.status <> 'PAUSED'
    RETURNING id, status, created_at
  `;
  return rows[0] ?? null;
}

export async function claimIntegrationSyncJob() {
  const rows = await prisma.$queryRaw<Array<{ id: string; workspace_id: string; integration_id: string; attempts: number }>>`
    WITH next_job AS (
      SELECT id FROM integration_sync_jobs
      WHERE (status = 'PENDING' AND available_at <= now())
         OR (status = 'PROCESSING' AND locked_at < now() - interval '3 minutes')
      ORDER BY available_at, created_at FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE integration_sync_jobs j SET status = 'PROCESSING', attempts = attempts + 1, locked_at = now()
    FROM next_job WHERE j.id = next_job.id
    RETURNING j.id, j.workspace_id, j.integration_id, j.attempts
  `;
  return rows[0] ?? null;
}

export async function finishIntegrationSyncJob(jobId: string, workspaceId: string, result: unknown) {
  await prisma.$executeRaw`
    UPDATE integration_sync_jobs SET status = 'DONE', result = ${JSON.stringify(result)}::jsonb, locked_at = NULL, error_code = NULL, finished_at = now()
    WHERE id = ${jobId}::uuid AND workspace_id = ${workspaceId}::uuid
  `;
}

export async function retryIntegrationSyncJob(jobId: string, workspaceId: string, integrationId: string, attempts: number, errorCode: string) {
  if (attempts >= 5) {
    await prisma.$transaction([
      prisma.$executeRaw`UPDATE integration_sync_jobs SET status = 'DEAD', locked_at = NULL, error_code = ${errorCode}, finished_at = now() WHERE id = ${jobId}::uuid AND workspace_id = ${workspaceId}::uuid`,
      prisma.$executeRaw`UPDATE external_integrations SET status = 'ERROR', updated_at = now() WHERE id = ${integrationId}::uuid AND workspace_id = ${workspaceId}::uuid`,
    ]);
    return;
  }
  const delaySeconds = Math.min(300, 2 ** attempts * 5);
  await prisma.$executeRaw`
    UPDATE integration_sync_jobs SET status = 'PENDING', locked_at = NULL, error_code = ${errorCode}, available_at = now() + (${delaySeconds} * interval '1 second')
    WHERE id = ${jobId}::uuid AND workspace_id = ${workspaceId}::uuid
  `;
}
