import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type CreateProjectBody = z.infer<typeof CreateProjectSchema>;