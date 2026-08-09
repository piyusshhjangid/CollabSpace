import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z.string(),
  completed: z.boolean().optional(),
});

export type CreateTaskBody = z.infer<typeof CreateTaskSchema>;
