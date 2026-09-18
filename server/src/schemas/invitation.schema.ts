import { z } from "zod";

export const CreateInvitationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

export type CreateInvitationBody = z.infer<
  typeof CreateInvitationSchema
>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export type AcceptInvitationBody = z.infer<
  typeof AcceptInvitationSchema
>;