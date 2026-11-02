import { z } from "zod";

export const GithubIntegrationSchema = z.object({
  projectId: z.string().uuid(),
  repository: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Use owner/repository format").max(255),
});
