import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, issueAccessToken } from "../factories.js";
import { prisma } from "../setup.js";
import crypto from "node:crypto";

describe("workspace onboarding & role membership", () => {
  it("returns an empty workspace list for a newly registered user without workspaces", async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    const response = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  it("assigns OWNER role to workspace creator via backend logic (client cannot supply role)", async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    // Client attempts to pass a custom or lower role
    const response = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Engineering Control Plane",
        role: "VIEWER", // Attempted override
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe("OWNER");
    const workspaceId = response.body.data.id;

    // Verify membership in database is strictly OWNER
    const membership = await prisma.workspace_members.findFirst({
      where: {
        workspace_id: workspaceId,
        user_id: user.id,
      },
    });
    expect(membership).not.toBeNull();
    expect(membership?.role).toBe("OWNER");

    // Verify GET /api/workspaces returns the created workspace with OWNER role
    const listResponse = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(workspaceId);
    expect(listResponse.body.data[0].role).toBe("OWNER");
  });

  it("allows joining a workspace via invitation token and assigns MEMBER role", async () => {
    const owner = await createUser();
    const invitee = await createUser();

    const ownerToken = issueAccessToken(owner.id);
    const inviteeToken = issueAccessToken(invitee.id);

    // Owner creates workspace
    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Collaboration Lab" });

    expect(wsRes.status).toBe(201);
    const workspaceId = wsRes.body.data.id;

    // Owner sends invitation to invitee's email
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: invitee.email });

    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.success).toBe(true);
    const inviteToken = inviteRes.body.data.token;
    expect(inviteToken).toBeDefined();

    // Invitee accepts invitation
    const acceptRes = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${inviteeToken}`)
      .send({ token: inviteToken });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.success).toBe(true);
    expect(acceptRes.body.data.workspaceId).toBe(workspaceId);
    expect(acceptRes.body.data.role).toBe("MEMBER");

    // Verify invitee sees workspace in GET /api/workspaces with MEMBER role
    const inviteeListRes = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${inviteeToken}`);

    expect(inviteeListRes.status).toBe(200);
    expect(inviteeListRes.body.data).toHaveLength(1);
    expect(inviteeListRes.body.data[0].id).toBe(workspaceId);
    expect(inviteeListRes.body.data[0].role).toBe("MEMBER");

    // Verify invitation is marked accepted in database
    const dbInvite = await prisma.invitations.findFirst({
      where: { token: inviteToken },
    });
    expect(dbInvite?.accepted_at).not.toBeNull();
  });

  it("rejects invitation acceptance when the token was sent to a different email", async () => {
    const owner = await createUser();
    const intendedUser = await createUser();
    const wrongUser = await createUser();

    const ownerToken = issueAccessToken(owner.id);
    const wrongUserToken = issueAccessToken(wrongUser.id);

    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Security Team" });

    const workspaceId = wsRes.body.data.id;

    // Invitation created for intendedUser.email
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: intendedUser.email });

    const inviteToken = inviteRes.body.data.token;

    // Wrong user attempts to accept
    const acceptRes = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${wrongUserToken}`)
      .send({ token: inviteToken });

    expect(acceptRes.status).toBe(403);
    expect(acceptRes.body.message).toMatch(/different email/i);
  });

  it("rejects expired or replayed invitation tokens", async () => {
    const owner = await createUser();
    const invitee = await createUser();

    const ownerToken = issueAccessToken(owner.id);
    const inviteeToken = issueAccessToken(invitee.id);

    const wsRes = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Test Expiry" });

    const workspaceId = wsRes.body.data.id;

    // Create an expired invitation directly in DB
    const expiredToken = crypto.randomBytes(32).toString("hex");
    await prisma.invitations.create({
      data: {
        workspace_id: workspaceId,
        invited_by: owner.id,
        email: invitee.email,
        token: expiredToken,
        expires_at: new Date(Date.now() - 1000 * 60), // Expired 1 minute ago
      },
    });

    const expiredRes = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${inviteeToken}`)
      .send({ token: expiredToken });

    expect(expiredRes.status).toBe(400);
    expect(expiredRes.body.message).toMatch(/expired/i);

    // Create a valid invitation and accept it once
    const inviteRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ email: invitee.email });

    const validToken = inviteRes.body.data.token;

    const firstAccept = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${inviteeToken}`)
      .send({ token: validToken });

    expect(firstAccept.status).toBe(200);

    // Replay attack: attempt to accept the same token again
    const secondAccept = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${inviteeToken}`)
      .send({ token: validToken });

    expect(secondAccept.status).toBe(400);
    expect(secondAccept.body.message).toMatch(/already been used/i);
  });

  it("rejects invalid invitation token", async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    const response = await request(app)
      .post("/api/invitations/accept")
      .set("Authorization", `Bearer ${token}`)
      .send({ token: "non-existent-token-12345" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid/i);
  });
});
