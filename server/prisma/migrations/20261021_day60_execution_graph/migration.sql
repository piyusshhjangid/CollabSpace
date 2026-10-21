ALTER TABLE "projects" ADD COLUMN "outcome_id" UUID;

CREATE TABLE "outcomes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL,
  "name" TEXT NOT NULL, "description" TEXT, "success_criteria" JSONB NOT NULL DEFAULT '[]',
  "target_date" DATE, "owner_id" UUID, "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "outcomes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "outcomes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_outcomes_workspace_target" ON "outcomes"("workspace_id", "target_date");
ALTER TABLE "projects" ADD CONSTRAINT "projects_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "outcomes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE TABLE "goals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL, "outcome_id" UUID NOT NULL,
  "name" TEXT NOT NULL, "success_criteria" JSONB NOT NULL DEFAULT '[]', "target_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "goals_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "outcomes"("id") ON DELETE CASCADE,
  CONSTRAINT "goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_goals_workspace_outcome" ON "goals"("workspace_id", "outcome_id");

CREATE TABLE "milestones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL, "goal_id" UUID NOT NULL,
  "name" TEXT NOT NULL, "due_date" DATE, "status" TEXT NOT NULL DEFAULT 'UPCOMING',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE,
  CONSTRAINT "milestones_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_milestones_workspace_goal_due" ON "milestones"("workspace_id", "goal_id", "due_date");

CREATE TABLE "task_dependencies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL, "project_id" UUID NOT NULL,
  "predecessor_task_id" UUID NOT NULL, "successor_task_id" UUID NOT NULL,
  "dependency_type" TEXT NOT NULL DEFAULT 'FINISH_TO_START', "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_task_dependency_edge" UNIQUE ("predecessor_task_id", "successor_task_id"),
  CONSTRAINT "task_dependencies_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "task_dependencies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE,
  CONSTRAINT "task_dependencies_predecessor_task_id_fkey" FOREIGN KEY ("predecessor_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "task_dependencies_successor_task_id_fkey" FOREIGN KEY ("successor_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_task_dependencies_workspace_project" ON "task_dependencies"("workspace_id", "project_id");

CREATE TABLE "delivery_contracts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL, "outcome_id" UUID NOT NULL,
  "version" INTEGER NOT NULL, "scope" TEXT NOT NULL, "deadline" DATE,
  "constraints" JSONB NOT NULL DEFAULT '[]', "acceptance_criteria" JSONB NOT NULL DEFAULT '[]',
  "owner_id" UUID, "created_by" UUID NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "delivery_contracts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_delivery_contract_outcome_version" UNIQUE ("outcome_id", "version"),
  CONSTRAINT "delivery_contracts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "delivery_contracts_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "outcomes"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_contracts_workspace_outcome_version" ON "delivery_contracts"("workspace_id", "outcome_id", "version");

CREATE TABLE "execution_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspace_id" UUID NOT NULL, "outcome_id" UUID NOT NULL,
  "contract_id" UUID, "version" INTEGER NOT NULL, "created_by" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "execution_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_execution_plan_outcome_version" UNIQUE ("outcome_id", "version"),
  CONSTRAINT "execution_plans_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_plans_outcome_id_fkey" FOREIGN KEY ("outcome_id") REFERENCES "outcomes"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_execution_plans_workspace_outcome_version" ON "execution_plans"("workspace_id", "outcome_id", "version");

CREATE TABLE "execution_plan_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "plan_id" UUID NOT NULL, "task_id" UUID, "task_title" TEXT NOT NULL,
  "planned_start" DATE, "planned_end" DATE, "duration_days" INTEGER NOT NULL DEFAULT 1, "order_index" INTEGER NOT NULL,
  CONSTRAINT "execution_plan_tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_execution_plan_task" UNIQUE ("plan_id", "task_id"),
  CONSTRAINT "execution_plan_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "execution_plans"("id") ON DELETE CASCADE,
  CONSTRAINT "execution_plan_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL,
  CONSTRAINT "execution_plan_tasks_dates_check" CHECK ("planned_end" IS NULL OR "planned_start" IS NULL OR "planned_end" >= "planned_start"),
  CONSTRAINT "execution_plan_tasks_duration_check" CHECK ("duration_days" > 0)
);
CREATE INDEX "idx_execution_plan_tasks_order" ON "execution_plan_tasks"("plan_id", "order_index");

CREATE TABLE "execution_plan_edges" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "plan_id" UUID NOT NULL,
  "predecessor_task_id" UUID NOT NULL, "predecessor_title" TEXT NOT NULL,
  "successor_task_id" UUID NOT NULL, "successor_title" TEXT NOT NULL,
  "dependency_type" TEXT NOT NULL,
  CONSTRAINT "execution_plan_edges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "uq_execution_plan_edge" UNIQUE ("plan_id", "predecessor_task_id", "successor_task_id"),
  CONSTRAINT "execution_plan_edges_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "execution_plans"("id") ON DELETE CASCADE
);
CREATE INDEX "idx_execution_plan_edges_plan" ON "execution_plan_edges"("plan_id");

CREATE TABLE "workspace_event_counters" (
  "workspace_id" UUID NOT NULL, "sequence" BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT "workspace_event_counters_pkey" PRIMARY KEY ("workspace_id"),
  CONSTRAINT "workspace_event_counters_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE
);
