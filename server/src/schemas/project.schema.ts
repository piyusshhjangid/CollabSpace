import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export type CreateProjectBody = z.infer<typeof CreateProjectSchema>;