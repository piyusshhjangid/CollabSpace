import { pool } from "../db/pool.js";
import type { Project } from "../types/project.js";

export async function findProjectsByWorkspace(workspaceId: string) {
  const result = await pool.query(
    `SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC`,
    [workspaceId]
  );
  return result.rows;
}

export async function createProject(workspaceId: string, name: string, description: string | undefined) {
  const result = await pool.query(
    `INSERT INTO projects (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [workspaceId, name, description]
  );
  return result.rows[0];
}

// findById()

// update()

// delete()
