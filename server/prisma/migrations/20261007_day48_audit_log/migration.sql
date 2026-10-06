-- Day 48: audit log
-- This migration intentionally adds only the audit_log table and its indexes.
-- Historical migrations are not modified.

CREATE TABLE "public"."audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" UUID,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_audit_log_workspace_created"
    ON "public"."audit_log"("workspace_id", "created_at");

CREATE INDEX "idx_audit_log_actor_created"
    ON "public"."audit_log"("actor_id", "created_at");

CREATE INDEX "idx_audit_log_action_created"
    ON "public"."audit_log"("action", "created_at");
