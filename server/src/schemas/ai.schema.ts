import { z } from "zod";

export const AnalyzeProjectSchema = z.object({ question: z.string().trim().max(500).optional() });
export const CreateProposalSchema = z.object({
  kind: z.literal("CREATE_TASK"),
  title: z.string().trim().min(3).max(180),
  rationale: z.string().trim().min(1).max(800),
  evidenceIds: z.array(z.string().uuid()).max(10).default([]),
});
export const ProposalDecisionSchema = z.object({ decision: z.enum(["APPROVE", "REJECT"]) });
