import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required"),
});

export type CreateWorkspaceBody = z.infer<
  typeof CreateWorkspaceSchema
>;