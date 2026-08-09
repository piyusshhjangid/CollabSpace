import { z } from "zod";

const TaskSchema = z.object({
  title: z.string(),
  completed: z.boolean().optional(),
});

const result = TaskSchema.safeParse({
  title: "Learn Zod",
  completed: false,
});

console.log(result);