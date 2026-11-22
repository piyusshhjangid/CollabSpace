import { z } from "zod";

const scenarioChanges = z.object({
  taskDelays: z.record(z.uuid(), z.number().int().min(0).max(365)).optional(),
  unavailableAssigneeIds: z.array(z.uuid()).max(100).optional(),
  unavailableDays: z.number().int().min(0).max(90).optional(),
  reassignTasks: z.array(z.object({ taskId: z.uuid(), assigneeId: z.uuid() })).max(500).optional(),
  excludedTaskIds: z.array(z.uuid()).max(500).optional(),
  removeWithDependents: z.boolean().default(false),
  addDependencies: z.array(z.object({ from: z.uuid(), to: z.uuid() })).max(500).optional(),
  removeDependencies: z.array(z.object({ from: z.uuid(), to: z.uuid() })).max(500).optional(),
  deadline: z.iso.date().nullable().optional(),
}).default(() => ({ removeWithDependents: false }));

export const CreateScenarioSchema = z.object({
  name: z.string().trim().min(1).max(120),
  changes: scenarioChanges,
});
export const CreateAgentRunSchema = z.object({
  agentType: z.enum(["PLANNER", "EVIDENCE", "RISK", "FORECAST", "RECOVERY", "EXECUTION", "COORDINATOR"]),
  budgetLimit: z.number().int().min(1).max(10000).default(1000),
  question: z.string().trim().max(500).optional(),
});
export const CreateKnowledgeDocumentSchema = z.object({
  title: z.string().trim().min(1).max(240),
  sourceType: z.enum(["MARKDOWN", "TEXT", "URL"]).default("MARKDOWN"),
  sourceUrl: z.url().max(2000).optional(),
  content: z.string().trim().min(20).max(100_000),
});
export const SearchKnowledgeSchema = z.object({
  query: z.string().trim().min(2).max(1000),
  limit: z.number().int().min(1).max(20).default(8),
});
export const CreateRecoveryPlanSchema = z.object({ name: z.string().trim().min(1).max(120).optional() }).default({});
export const DecideRecoveryPlanSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]), optionKey: z.string().trim().min(1).max(80).optional() });
export const StartIntegrationSchema = z.object({
  projectId: z.uuid(),
  externalRef: z.string().trim().max(160).optional(),
  channelId: z.string().trim().max(120).optional(),
});
