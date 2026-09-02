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

export async function getOverdueTasks() {
  const result = await pool.query(
    `
    SELECT
      id,
      title,
      status,
      due_date
    FROM tasks
    WHERE due_date < NOW()
      AND status != 'DONE'
    ORDER BY due_date ASC
  `,
  );

  return result.rows;
}

export async function getTaskCountsByStatus(projectId: string) {
  const result = await pool.query(
    `
      SELECT
        status,
        COUNT(*) AS task_count
      FROM tasks
      WHERE project_id = $1
      GROUP BY status
      ORDER BY status
    `,
    [projectId],
  );

  return result.rows;
}

// findById()

// update()

// delete()
