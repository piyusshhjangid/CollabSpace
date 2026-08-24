import { tasks } from "../data/fakeStore.js";
import type { Task } from "../types/task.js";
import { pool } from "../db/pool.js";

export async function findTasksByProject(projectId: string) {
  const result = await pool.query(
    `
    SELECT
      t.id,
      t.title,
      t.completed,
      p.name AS project,
      u.name AS assigned_to
    FROM tasks t
    INNER JOIN projects p
        ON t.project_id = p.id
    LEFT JOIN users u
        ON t.assigned_to = u.id
    WHERE t.project_id = $1;
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
