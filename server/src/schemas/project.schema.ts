import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  outcomeId: z.uuid().optional(),
});

export type CreateProjectBody = z.infer<typeof CreateProjectSchema>;

export const LinkProjectOutcomeSchema = z.object({
  outcomeId: z.uuid().nullable(),
});
