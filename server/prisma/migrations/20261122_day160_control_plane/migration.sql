CREATE TABLE "execution_history_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "captured_by" UUID NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "execution_history_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "execution_history_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_history_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_history_actor_fkey" FOREIGN KEY ("captured_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_execution_history_project_time" ON "execution_history_snapshots"("workspace_id", "project_id", "created_at" DESC);

CREATE TABLE "execution_scenarios" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "changes" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "execution_scenarios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "execution_scenario_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_scenario_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_scenario_actor_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_execution_scenarios_project_time" ON "execution_scenarios"("workspace_id", "project_id", "created_at" DESC);

CREATE TABLE "execution_scenario_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "input_hash" VARCHAR(64) NOT NULL,
  "input_snapshot" JSONB NOT NULL,
  "result" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "execution_scenario_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "execution_scenario_run_scenario_fkey" FOREIGN KEY ("scenario_id") REFERENCES "execution_scenarios"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_scenario_run_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_scenario_run_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_execution_scenario_run_input" UNIQUE ("scenario_id", "input_hash")
);
CREATE INDEX "idx_execution_scenario_runs_project_time" ON "execution_scenario_runs"("workspace_id", "project_id", "created_at" DESC);

CREATE TABLE "recovery_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "root_cause" JSONB NOT NULL,
  "options" JSONB NOT NULL,
  "selected_option_key" VARCHAR(80),
  "decided_by" UUID,
  "decided_at" TIMESTAMPTZ(6),
  "verification" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recovery_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recovery_plan_status_check" CHECK ("status" IN ('PENDING','APPROVED','QUEUED','EXECUTING','SUCCEEDED','FAILED','REJECTED')),
  CONSTRAINT "recovery_plan_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_plan_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_plan_creator_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_plan_decider_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_recovery_plans_project_status" ON "recovery_plans"("workspace_id", "project_id", "status", "created_at" DESC);

CREATE TABLE "recovery_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at" TIMESTAMPTZ(6),
  "last_error" VARCHAR(120),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recovery_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recovery_job_status_check" CHECK ("status" IN ('PENDING','PROCESSING','DONE','DEAD')),
  CONSTRAINT "recovery_job_plan_fkey" FOREIGN KEY ("plan_id") REFERENCES "recovery_plans"("id") ON DELETE CASCADE,
  CONSTRAINT "recovery_job_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "uq_recovery_job_plan" UNIQUE ("plan_id")
);
CREATE INDEX "idx_recovery_jobs_poll" ON "recovery_jobs"("status", "available_at");

CREATE TABLE "agent_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "agent_type" VARCHAR(24) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
  "input" JSONB NOT NULL,
  "result" JSONB,
  "budget_limit" INTEGER NOT NULL DEFAULT 1000,
  "budget_used" INTEGER NOT NULL DEFAULT 0,
  "idempotency_key" VARCHAR(120),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(6),
  CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agent_type_check" CHECK ("agent_type" IN ('PLANNER','EVIDENCE','RISK','FORECAST','RECOVERY','EXECUTION','COORDINATOR')),
  CONSTRAINT "agent_run_status_check" CHECK ("status" IN ('QUEUED','RUNNING','SUCCEEDED','FAILED')),
  CONSTRAINT "agent_budget_check" CHECK ("budget_limit" BETWEEN 1 AND 10000 AND "budget_used" >= 0),
  CONSTRAINT "agent_run_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_run_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "agent_run_actor_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "uq_agent_run_idempotency" ON "agent_runs"("workspace_id", "requested_by", "idempotency_key") WHERE "idempotency_key" IS NOT NULL;
CREATE INDEX "idx_agent_runs_project_time" ON "agent_runs"("workspace_id", "project_id", "created_at" DESC);

CREATE TABLE "agent_run_steps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL,
  "step_index" INTEGER NOT NULL,
  "agent_role" VARCHAR(24) NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "input" JSONB NOT NULL,
  "result" JSONB,
  "citations" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(6),
  CONSTRAINT "agent_run_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_agent_run_step" UNIQUE ("run_id", "step_index"),
  CONSTRAINT "agent_run_step_parent_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_agent_run_steps_run_time" ON "agent_run_steps"("run_id", "started_at");

CREATE TABLE "knowledge_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "title" VARCHAR(240) NOT NULL,
  "source_type" VARCHAR(24) NOT NULL,
  "source_url" TEXT,
  "content_hash" VARCHAR(64) NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_document_source_check" CHECK ("source_type" IN ('MARKDOWN','TEXT','URL')),
  CONSTRAINT "uq_knowledge_document_hash" UNIQUE ("workspace_id", "content_hash"),
  CONSTRAINT "knowledge_document_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "knowledge_document_actor_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_knowledge_documents_workspace_time" ON "knowledge_documents"("workspace_id", "created_at" DESC);

CREATE TABLE "knowledge_chunks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "heading" VARCHAR(240),
  "content" TEXT NOT NULL,
  "embedding" JSONB,
  "search_vector" TSVECTOR GENERATED ALWAYS AS (to_tsvector('english'::regconfig, "content")) STORED,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_knowledge_chunk_order" UNIQUE ("document_id", "chunk_index"),
  CONSTRAINT "knowledge_chunk_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "knowledge_chunk_document_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_knowledge_chunks_workspace_document" ON "knowledge_chunks"("workspace_id", "document_id");
CREATE INDEX "idx_knowledge_chunks_search" ON "knowledge_chunks" USING GIN ("search_vector");

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  ALTER TABLE "knowledge_chunks" ADD COLUMN "embedding_vector" vector(768);
EXCEPTION WHEN undefined_file OR insufficient_privilege THEN
  RAISE NOTICE 'pgvector is unavailable; CollabSpace will use scoped full-text retrieval.';
END $$;

CREATE TABLE "external_integrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID,
  "created_by" UUID NOT NULL,
  "provider" VARCHAR(24) NOT NULL,
  "external_account_id" VARCHAR(240) NOT NULL,
  "display_name" VARCHAR(240) NOT NULL,
  "base_url" TEXT,
  "credentials_ciphertext" TEXT,
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "last_synced_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_integrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "external_integration_provider_check" CHECK ("provider" IN ('JIRA','LINEAR','GITLAB','SLACK')),
  CONSTRAINT "external_integration_status_check" CHECK ("status" IN ('ACTIVE','PAUSED','ERROR')),
  CONSTRAINT "uq_external_integration_scope" UNIQUE ("workspace_id", "provider", "external_account_id"),
  CONSTRAINT "external_integration_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "external_integration_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "external_integration_actor_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_external_integrations_provider_status" ON "external_integrations"("workspace_id", "provider", "status");

CREATE TABLE "integration_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "integration_id" UUID NOT NULL,
  "task_id" UUID,
  "provider" VARCHAR(24) NOT NULL,
  "external_id" VARCHAR(200) NOT NULL,
  "event_type" VARCHAR(80) NOT NULL,
  "actor" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "url" TEXT,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_integration_event_external" UNIQUE ("integration_id", "external_id"),
  CONSTRAINT "integration_event_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_event_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_event_integration_fkey" FOREIGN KEY ("integration_id") REFERENCES "external_integrations"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_event_task_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_integration_events_project_time" ON "integration_events"("workspace_id", "project_id", "occurred_at" DESC);

CREATE TABLE "integration_resource_links" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "provider" VARCHAR(24) NOT NULL,
  "external_id" VARCHAR(200) NOT NULL,
  "external_url" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_resource_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_integration_resource_external" UNIQUE ("workspace_id", "provider", "external_id"),
  CONSTRAINT "integration_resource_task_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_resource_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_integration_resource_task" ON "integration_resource_links"("workspace_id", "task_id");

CREATE TABLE "integration_oauth_states" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "state_hash" VARCHAR(64) NOT NULL,
  "workspace_id" UUID NOT NULL,
  "project_id" UUID,
  "user_id" UUID NOT NULL,
  "provider" VARCHAR(24) NOT NULL,
  "provider_config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "consumed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_oauth_states_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_integration_oauth_state_hash" UNIQUE ("state_hash"),
  CONSTRAINT "integration_oauth_state_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_oauth_state_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_oauth_state_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_integration_oauth_states_expiry" ON "integration_oauth_states"("expires_at");

CREATE TABLE "integration_sync_jobs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "integration_id" UUID NOT NULL,
  "requested_by" UUID NOT NULL,
  "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "available_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked_at" TIMESTAMPTZ(6),
  "error_code" VARCHAR(100),
  "result" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(6),
  CONSTRAINT "integration_sync_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "integration_sync_job_status_check" CHECK ("status" IN ('PENDING','PROCESSING','DONE','DEAD')),
  CONSTRAINT "integration_sync_job_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_sync_job_integration_fkey" FOREIGN KEY ("integration_id") REFERENCES "external_integrations"("id") ON DELETE CASCADE,
  CONSTRAINT "integration_sync_job_requester_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_integration_sync_jobs_poll" ON "integration_sync_jobs"("status", "available_at");
CREATE INDEX "idx_integration_sync_jobs_integration_time" ON "integration_sync_jobs"("integration_id", "created_at" DESC);

CREATE TABLE "ai_evaluations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID,
  "run_id" UUID,
  "case_key" VARCHAR(120) NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "metrics" JSONB NOT NULL,
  "latency_ms" INTEGER,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_evaluations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_evaluation_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "ai_evaluation_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL,
  CONSTRAINT "ai_evaluation_run_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_ai_evaluations_workspace_time" ON "ai_evaluations"("workspace_id", "created_at" DESC);
