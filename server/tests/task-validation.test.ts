import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "./setup.js";
import {
  createProject,
  createTask,
  createUser,
  createWorkspace,
  issueAccessToken,
} from "./factories.js";

async function createFixture() {
  const user = await createUser();
  const workspace = await createWorkspace(user.id);
  const project = await createProject(workspace.id);
  const task = await createTask(
    project.id,
    workspace.id,
    "Validation test task",
    user.id,
  );

  return {
    user,
    workspace,
    project,
    task,
    token: issueAccessToken(user.id),
    taskUrl: `/api/projects/${project.id}/tasks`,
    workspaceQuery: `?workspaceId=${workspace.id}`,
  };
}

describe("task request validation", () => {
  it("rejects an invalid status when creating a task", async () => {
    const fixture = await createFixture();
    const before = await prisma.tasks.count();

    const response = await request(app)
      .post(`${fixture.taskUrl}${fixture.workspaceQuery}`)
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({
        title: "Invalid status task",
        status: "BLOCKED",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation failed");
    expect(await prisma.tasks.count()).toBe(before);
  });

  it("rejects an invalid status when updating a task", async () => {
    const fixture = await createFixture();

    const response = await request(app)
      .patch(
        `${fixture.taskUrl}/${fixture.task.id}${fixture.workspaceQuery}`,
      )
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ status: "BLOCKED" });

    expect(response.status).toBe(400);

    const unchanged = await prisma.tasks.findUnique({
      where: { id: fixture.task.id },
    });

    expect(unchanged?.status).toBe("TODO");
    expect(unchanged?.title).toBe("Validation test task");
  });

  it("rejects an empty update body", async () => {
    const fixture = await createFixture();

    const response = await request(app)
      .patch(
        `${fixture.taskUrl}/${fixture.task.id}${fixture.workspaceQuery}`,
      )
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({});

    expect(response.status).toBe(400);

    const unchanged = await prisma.tasks.findUnique({
      where: { id: fixture.task.id },
    });

    expect(unchanged?.title).toBe("Validation test task");
    expect(unchanged?.status).toBe("TODO");
  });

  it("rejects a blank title when creating a task", async () => {
    const fixture = await createFixture();
    const before = await prisma.tasks.count();

    const response = await request(app)
      .post(`${fixture.taskUrl}${fixture.workspaceQuery}`)
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ title: "   " });

    expect(response.status).toBe(400);
    expect(await prisma.tasks.count()).toBe(before);
  });

  it("accepts a valid status update", async () => {
    const fixture = await createFixture();

    const response = await request(app)
      .patch(
        `${fixture.taskUrl}/${fixture.task.id}${fixture.workspaceQuery}`,
      )
      .set("Authorization", `Bearer ${fixture.token}`)
      .send({ status: "IN_PROGRESS" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("IN_PROGRESS");
  });
});
