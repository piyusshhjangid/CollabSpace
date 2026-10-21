import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(100, "Workspace name must be 100 characters or fewer"),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Workspace name is required").max(100, "Workspace name must be 100 characters or fewer"),
});

export type CreateWorkspaceBody = z.infer<
  typeof CreateWorkspaceSchema
>;

export type UpdateWorkspaceBody = z.infer<typeof UpdateWorkspaceSchema>;
