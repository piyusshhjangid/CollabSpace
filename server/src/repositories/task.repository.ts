import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";
import { pool } from "../db/pool.js";

export async function findTasksByProject(projectId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM tasks
    WHERE project_id = $1
    ORDER BY created_at DESC
    `,
    [projectId],
  );

  return result.rows;
}

export async function createTask(
  projectId: string,
  workspaceId: string,
  title: string,
  assignedTo?: string,
) {
  const result = await pool.query(
    `
    INSERT INTO tasks (
      project_id,
      workspace_id,
      title,
      assigned_to
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [projectId, workspaceId, title, assignedTo ?? null],
  );

  return result.rows[0];
}

// findById()

// update()

// delete()
