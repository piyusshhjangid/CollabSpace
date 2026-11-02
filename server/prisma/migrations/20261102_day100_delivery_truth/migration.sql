CREATE TABLE "github_integrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "repository" VARCHAR(255) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "github_integrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "github_integrations_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "github_integrations_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "uq_github_integration_repository" ON "github_integrations"("repository");
CREATE INDEX "idx_github_integration_enabled" ON "github_integrations"("enabled");

CREATE TABLE "github_webhook_deliveries" (
  "delivery_id" VARCHAR(100) NOT NULL,
  "repository" VARCHAR(255) NOT NULL,
  "event_type" VARCHAR(80) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(6),
  "error_code" VARCHAR(80),
  CONSTRAINT "github_webhook_deliveries_pkey" PRIMARY KEY ("delivery_id")
);
CREATE INDEX "idx_github_delivery_status_received" ON "github_webhook_deliveries"("status", "received_at");
CREATE INDEX "idx_github_delivery_repo_received" ON "github_webhook_deliveries"("repository", "received_at");

CREATE TABLE "execution_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "task_id" UUID,
  "integration_id" UUID NOT NULL,
  "source" VARCHAR(30) NOT NULL,
  "external_id" VARCHAR(160) NOT NULL,
  "event_type" VARCHAR(80) NOT NULL,
  "action" VARCHAR(80),
  "actor" VARCHAR(255),
  "title" TEXT NOT NULL,
  "body" TEXT,
  "url" TEXT,
  "branch" TEXT,
  "occurred_at" TIMESTAMPTZ(6) NOT NULL,
  "link_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "execution_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "execution_events_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "execution_events_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "execution_events_task_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "execution_events_integration_fkey" FOREIGN KEY ("integration_id") REFERENCES "github_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "uq_execution_event_source_external" ON "execution_events"("source", "external_id");
CREATE INDEX "idx_execution_events_workspace_time" ON "execution_events"("workspace_id", "occurred_at" DESC);
CREATE INDEX "idx_execution_events_project_time" ON "execution_events"("project_id", "occurred_at" DESC);
CREATE INDEX "idx_execution_events_task_time" ON "execution_events"("task_id", "occurred_at" DESC);

CREATE TABLE "task_evidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "task_id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "evidence_type" VARCHAR(50) NOT NULL,
  "observed_status" VARCHAR(30) NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "explanation" TEXT NOT NULL,
  "provenance" JSONB NOT NULL,
  "captured_at" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_evidence_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_evidence_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_evidence_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_evidence_task_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_evidence_event_fkey" FOREIGN KEY ("event_id") REFERENCES "execution_events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "uq_task_evidence_task_event" ON "task_evidence"("task_id", "event_id");
CREATE INDEX "idx_task_evidence_workspace_task_time" ON "task_evidence"("workspace_id", "task_id", "captured_at" DESC);

CREATE TABLE "task_truth" (
  "task_id" UUID NOT NULL,
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "declared_status" VARCHAR(30) NOT NULL,
  "observed_status" VARCHAR(30) NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "explanation" TEXT NOT NULL,
  "evidence_count" INTEGER NOT NULL DEFAULT 0,
  "reconciled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_truth_pkey" PRIMARY KEY ("task_id"),
  CONSTRAINT "task_truth_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_truth_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "task_truth_task_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "idx_task_truth_workspace_project_status" ON "task_truth"("workspace_id", "project_id", "observed_status");

CREATE TABLE "ai_proposals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "created_by" UUID NOT NULL,
  "kind" VARCHAR(40) NOT NULL,
  "payload" JSONB NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  "decided_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decided_at" TIMESTAMPTZ(6),
  CONSTRAINT "ai_proposals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ai_proposals_workspace_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ai_proposals_project_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ai_proposals_creator_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ai_proposals_decider_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "idx_ai_proposals_workspace_project_status" ON "ai_proposals"("workspace_id", "project_id", "status", "created_at");

ALTER TABLE "tasks" ADD COLUMN "task_key" VARCHAR(20);
UPDATE "tasks" SET "task_key" = 'CS-' || upper(substr(replace("id"::text, '-', ''), 1, 12));
CREATE UNIQUE INDEX "uq_tasks_task_key" ON "tasks"("task_key");
