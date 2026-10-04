import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../setup.js";
import {
  createTwoTenantFixture,
} from "../factories.js";

function expectCrossTenantFailure(status: number) {
  expect([400, 401, 403, 404]).toContain(status);
}

describe("tenant isolation", () => {
  it("does not list another tenant's workspace", async () => {
    const fixture = await createTwoTenantFixture();

    const response = await request(app)
      .get("/api/workspaces")
      .set("Authorization", `Bearer ${fixture.tokenA}`);

    expect(response.status).toBe(200);

    const ids = (response.body?.data ?? []).map(
      (workspace: { id: string }) => workspace.id,
    );

    expect(ids).toContain(fixture.workspaceA.id);
    expect(ids).not.toContain(fixture.workspaceB.id);
  });

  it("blocks User A from every Workspace B scoped route", async () => {
    const fixture = await createTwoTenantFixture();

    const cases: Array<{
      name: string;
      method: "get" | "post" | "delete" | "patch";
      path: string;
      body?: Record<string, unknown>;
    }> = [
      {
        name: "workspace role",
        method: "get",
        path: `/api/workspaces/${fixture.workspaceB.id}/me`,
      },
      {
        name: "workspace member removal",
        method: "delete",
        path: `/api/workspaces/${fixture.workspaceB.id}/members/${fixture.userB.id}`,
      },
      {
        name: "workspace deletion",
        method: "delete",
        path: `/api/workspaces/${fixture.workspaceB.id}`,
      },
      {
        name: "project listing",
        method: "get",
        path: `/api/workspaces/${fixture.workspaceB.id}/projects`,
      },
      {
        name: "project creation",
        method: "post",
        path: `/api/workspaces/${fixture.workspaceB.id}/projects`,
        body: {
          name: "Unauthorized Project",
          description: "Tenant isolation attack",
        },
      },
      {
        name: "project deletion",
        method: "delete",
        path: `/api/workspaces/${fixture.workspaceB.id}/projects/${fixture.projectB.id}`,
      },
      {
        name: "project summary",
        method: "get",
        path: `/api/projects/${fixture.projectB.id}/summary?workspaceId=${fixture.workspaceB.id}`,
      },
      {
        name: "task listing",
        method: "get",
        path: `/api/projects/${fixture.projectB.id}/tasks?workspaceId=${fixture.workspaceB.id}`,
      },
      {
        name: "task creation",
        method: "post",
        path: `/api/projects/${fixture.projectB.id}/tasks?workspaceId=${fixture.workspaceB.id}`,
        body: {
          title: "Unauthorized Task",
        },
      },
      {
        name: "task update",
        method: "patch",
        path: `/api/projects/${fixture.projectB.id}/tasks/${fixture.taskB.id}?workspaceId=${fixture.workspaceB.id}`,
        body: {
          title: "Tenant B Hijacked",
        },
      },
      {
        name: "invitation creation",
        method: "post",
        path: `/api/workspaces/${fixture.workspaceB.id}/invitations`,
        body: {
          email: "attacker@example.test",
        },
      },
    ];

    for (const testCase of cases) {
      const builder = request(app)[testCase.method](testCase.path)
        .set("Authorization", `Bearer ${fixture.tokenA}`);

      const response = testCase.body
        ? await builder.send(testCase.body)
        : await builder;

      expectCrossTenantFailure(response.status);
    }
  });

  it("rejects a Project B ID when the request claims Workspace A", async () => {
    const fixture = await createTwoTenantFixture();

    const response = await request(app)
      .get(
        `/api/projects/${fixture.projectB.id}/summary?workspaceId=${fixture.workspaceA.id}`,
      )
      .set("Authorization", `Bearer ${fixture.tokenA}`);

    expectCrossTenantFailure(response.status);
  });

  it("rejects a Task B lookup when the request claims Workspace A", async () => {
    const fixture = await createTwoTenantFixture();

    const response = await request(app)
      .get(
        `/api/projects/${fixture.projectB.id}/tasks?workspaceId=${fixture.workspaceA.id}`,
      )
      .set("Authorization", `Bearer ${fixture.tokenA}`);

    expectCrossTenantFailure(response.status);
  });

  it("rejects creating a Task in Project B with Workspace A context", async () => {
    const fixture = await createTwoTenantFixture();

    const before = await prisma.tasks.count();

    const response = await request(app)
      .post(
        `/api/projects/${fixture.projectB.id}/tasks?workspaceId=${fixture.workspaceA.id}`,
      )
      .set("Authorization", `Bearer ${fixture.tokenA}`)
      .send({
        title: "Cross-tenant task injection",
      });

    expectCrossTenantFailure(response.status);

    const after = await prisma.tasks.count();

    expect(after).toBe(before);

    const created = await prisma.tasks.findFirst({
      where: {
        title: "Cross-tenant task injection",
      },
    });

    expect(created).toBeNull();
  });

  it("rejects updating Task B with Workspace A context", async () => {
    const fixture = await createTwoTenantFixture();

    const response = await request(app)
      .patch(
        `/api/projects/${fixture.projectB.id}/tasks/${fixture.taskB.id}?workspaceId=${fixture.workspaceA.id}`,
      )
      .set("Authorization", `Bearer ${fixture.tokenA}`)
      .send({
        title: "Cross-tenant overwrite",
      });

    expectCrossTenantFailure(response.status);

    const unchanged = await prisma.tasks.findUnique({
      where: {
        id: fixture.taskB.id,
      },
    });

    expect(unchanged?.title).toBe("Workspace B Task");
  });

  it("rejects deleting Project B with Workspace A context", async () => {
    const fixture = await createTwoTenantFixture();

    const response = await request(app)
      .delete(
        `/api/workspaces/${fixture.workspaceA.id}/projects/${fixture.projectB.id}`,
      )
      .set("Authorization", `Bearer ${fixture.tokenA}`);

    expectCrossTenantFailure(response.status);

    const projectStillExists = await prisma.projects.findUnique({
      where: {
        id: fixture.projectB.id,
      },
    });

    expect(projectStillExists).not.toBeNull();
  });
});
