import { describe, expect, it } from "vitest";
import { prisma } from "./setup.js";
import {
  createProject,
  createTask,
  createUser,
  createWorkspace,
} from "./factories.js";
import { updateTask } from "../src/repositories/task.repository.js";

async function createTaskFixture(
  initialStatus: "TODO" | "IN_PROGRESS" | "DONE" = "TODO",
) {
  const user = await createUser();
  const workspace = await createWorkspace(user.id);
  const project = await createProject(workspace.id);
  const task = await createTask(
    project.id,
    workspace.id,
    "Status history test task",
    user.id,
  );

  await prisma.tasks.update({
    where: { id: task.id },
    data: {
      status: initialStatus,
      completed: initialStatus === "DONE",
      completed_at: initialStatus === "DONE" ? new Date() : null,
    },
  });

  return { user, workspace, task };
}

describe("task status history", () => {
  it("records an explicit status transition", async () => {
    const { user, workspace, task } = await createTaskFixture();

    const updated = await updateTask(task.id, workspace.id, user.id, {
      status: "IN_PROGRESS",
    });

    expect(updated?.status).toBe("IN_PROGRESS");

    const history = await prisma.task_status_history.findMany({
      where: { task_id: task.id },
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.from_status).toBe("TODO");
    expect(history[0]?.to_status).toBe("IN_PROGRESS");
    expect(history[0]?.changed_by).toBe(user.id);
  });

  it("records a transition caused by completed=true", async () => {
    const { user, workspace, task } = await createTaskFixture();

    const updated = await updateTask(task.id, workspace.id, user.id, {
      completed: true,
    });

    expect(updated?.status).toBe("DONE");
    expect(updated?.completed).toBe(true);

    const history = await prisma.task_status_history.findMany({
      where: { task_id: task.id },
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.from_status).toBe("TODO");
    expect(history[0]?.to_status).toBe("DONE");
  });

  it("does not create history for a title-only update", async () => {
    const { user, workspace, task } = await createTaskFixture();

    const updated = await updateTask(task.id, workspace.id, user.id, {
      title: "Renamed task",
    });

    expect(updated?.title).toBe("Renamed task");
    expect(updated?.status).toBe("TODO");

    const history = await prisma.task_status_history.findMany({
      where: { task_id: task.id },
    });

    expect(history).toHaveLength(0);
  });

  it("does not create history when the status remains unchanged", async () => {
    const { user, workspace, task } =
      await createTaskFixture("IN_PROGRESS");

    await updateTask(task.id, workspace.id, user.id, {
      status: "IN_PROGRESS",
    });

    const history = await prisma.task_status_history.findMany({
      where: { task_id: task.id },
    });

    expect(history).toHaveLength(0);
  });

  it("transitions from DONE to TODO when completed is set to false", async () => {
    const { user, workspace, task } = await createTaskFixture("DONE");

    const updated = await updateTask(task.id, workspace.id, user.id, {
      completed: false,
    });

    expect(updated?.status).toBe("TODO");
    expect(updated?.completed).toBe(false);
    expect(updated?.completed_at).toBeNull();

    const history = await prisma.task_status_history.findMany({
      where: { task_id: task.id },
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.from_status).toBe("DONE");
    expect(history[0]?.to_status).toBe("TODO");
  });
});