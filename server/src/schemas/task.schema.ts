import { z } from "zod";

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required"),

  completed: z
    .boolean()
    .optional(),
});

export type CreateTaskBody = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required")
      .optional(),

    completed: z
      .boolean()
      .optional(),

    status: z
      .string()
      .trim()
      .min(1, "Task status is required")
      .optional(),
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.completed !== undefined ||
      body.status !== undefined,
    {
      message: "At least one field is required",
    },
  );

export type UpdateTaskBody = z.infer<
  typeof UpdateTaskSchema
>;
