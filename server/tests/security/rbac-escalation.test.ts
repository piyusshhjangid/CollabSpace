import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app.js";
import {
  addMember,
  createProject,
  createTask,
  createUser,
  createWorkspace,
  issueAccessToken,
} from "../factories.js";

describe("RBAC privilege escalation attacks", () => {
  it("1. blocks VIEWER from creating a project", async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(viewer.id, workspace.id, "VIEWER");

    const response = await request(app)
      .post(`/api/workspaces/${workspace.id}/projects`)
      .set("Authorization", `Bearer ${issueAccessToken(viewer.id)}`)
      .send({
        name: "Unauthorized Project",
        description: "Should not be created",
      });

    expect(response.status).toBe(403);
  });

  it("2. blocks VIEWER from creating a task", async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const workspace = await createWorkspace(owner.id);
    const project = await createProject(workspace.id);

    await addMember(viewer.id, workspace.id, "VIEWER");

    const response = await request(app)
      .post(
        `/api/projects/${project.id}/tasks?workspaceId=${workspace.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(viewer.id)}`)
      .send({
        title: "Unauthorized Task",
      });

    expect(response.status).toBe(403);
  });

  it("3. blocks VIEWER from updating their own task", async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const workspace = await createWorkspace(owner.id);
    const project = await createProject(workspace.id);
    const task = await createTask(
      project.id,
      workspace.id,
      "Viewer-owned task",
      viewer.id,
    );

    await addMember(viewer.id, workspace.id, "VIEWER");

    const response = await request(app)
      .patch(
        `/api/projects/${project.id}/tasks/${task.id}?workspaceId=${workspace.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(viewer.id)}`)
      .send({
        title: "Unauthorized update",
      });

    expect(response.status).toBe(403);
  });

  it("4. blocks MEMBER from inviting another member", async () => {
    const owner = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(member.id, workspace.id, "MEMBER");

    const response = await request(app)
      .post(`/api/workspaces/${workspace.id}/invitations`)
      .set("Authorization", `Bearer ${issueAccessToken(member.id)}`)
      .send({
        email: "attacker@example.test",
      });

    expect(response.status).toBe(403);
  });

  it("5. blocks MEMBER from removing another member", async () => {
    const owner = await createUser();
    const member = await createUser();
    const target = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(member.id, workspace.id, "MEMBER");
    await addMember(target.id, workspace.id, "MEMBER");

    const response = await request(app)
      .delete(
        `/api/workspaces/${workspace.id}/members/${target.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(member.id)}`);

    expect(response.status).toBe(403);
  });

  it("6. blocks MEMBER from deleting a project", async () => {
    const owner = await createUser();
    const member = await createUser();
    const workspace = await createWorkspace(owner.id);
    const project = await createProject(workspace.id);

    await addMember(member.id, workspace.id, "MEMBER");

    const response = await request(app)
      .delete(
        `/api/workspaces/${workspace.id}/projects/${project.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(member.id)}`);

    expect(response.status).toBe(403);
  });

  it("7. blocks ADMIN from deleting a workspace", async () => {
    const owner = await createUser();
    const admin = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(admin.id, workspace.id, "ADMIN");

    const response = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Authorization", `Bearer ${issueAccessToken(admin.id)}`);

    expect(response.status).toBe(403);
  });

  it("8. blocks VIEWER from deleting a workspace", async () => {
    const owner = await createUser();
    const viewer = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(viewer.id, workspace.id, "VIEWER");

    const response = await request(app)
      .delete(`/api/workspaces/${workspace.id}`)
      .set("Authorization", `Bearer ${issueAccessToken(viewer.id)}`);

    expect(response.status).toBe(403);
  });

  it("9. blocks ADMIN from removing the workspace OWNER", async () => {
    const owner = await createUser();
    const admin = await createUser();
    const workspace = await createWorkspace(owner.id);

    await addMember(admin.id, workspace.id, "ADMIN");

    const response = await request(app)
      .delete(
        `/api/workspaces/${workspace.id}/members/${owner.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(admin.id)}`);

    expect(response.status).toBe(403);
  });

  it("10. blocks MEMBER from updating a task owned by another user", async () => {
    const owner = await createUser();
    const member = await createUser();
    const taskOwner = await createUser();

    const workspace = await createWorkspace(owner.id);
    const project = await createProject(workspace.id);

    await addMember(member.id, workspace.id, "MEMBER");
    await addMember(taskOwner.id, workspace.id, "MEMBER");

    const task = await createTask(
      project.id,
      workspace.id,
      "Protected task",
      taskOwner.id,
    );

    const response = await request(app)
      .patch(
        `/api/projects/${project.id}/tasks/${task.id}?workspaceId=${workspace.id}`,
      )
      .set("Authorization", `Bearer ${issueAccessToken(member.id)}`)
      .send({
        title: "Privilege escalation attempt",
      });

    expect(response.status).toBe(403);
  });
});
