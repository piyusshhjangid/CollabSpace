import { z } from "zod";

const criteria = z.array(z.string().trim().min(1).max(240)).max(20);
const date = z.iso.date().nullable().optional();

export const CreateOutcomeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  successCriteria: criteria.min(1),
  targetDate: date,
  ownerId: z.uuid().nullable().optional(),
});
export const CreateGoalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  successCriteria: criteria.default([]),
  targetDate: date,
});
export const CreateMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dueDate: date,
  status: z.enum(["UPCOMING", "IN_PROGRESS", "DONE"]).optional(),
});
export const UpdateOutcomeSchema = CreateOutcomeSchema.partial().refine((body) => Object.keys(body).length > 0, "At least one field is required");
export const UpdateGoalSchema = CreateGoalSchema.partial().refine((body) => Object.keys(body).length > 0, "At least one field is required");
export const UpdateMilestoneSchema = CreateMilestoneSchema.partial().refine((body) => Object.keys(body).length > 0, "At least one field is required");
export const CreateContractSchema = z.object({
  scope: z.string().trim().min(1).max(4000),
  deadline: date,
  constraints: criteria.default([]),
  acceptanceCriteria: criteria.min(1),
  ownerId: z.uuid().nullable().optional(),
});
export const CreatePlanSchema = z.object({
  contractId: z.uuid().nullable().optional(),
  tasks: z.array(z.object({
    taskId: z.uuid(),
    plannedStart: date,
    plannedEnd: date,
    durationDays: z.number().int().positive().max(3650).default(1),
  })).min(1).max(500),
});
export const CreateDependencySchema = z.object({
  predecessorTaskId: z.uuid(),
  successorTaskId: z.uuid(),
  dependencyType: z.enum(["FINISH_TO_START", "START_TO_START", "FINISH_TO_FINISH", "START_TO_FINISH"]).default("FINISH_TO_START"),
});
