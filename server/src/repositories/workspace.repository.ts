import { pool } from "../db/pool.js";

export async function findAllWorkspaces() {
  const result = await pool.query(`SELECT * FROM workspaces ORDER BY created_at DESC`);
  return result.rows;
}

// findById()

// create()

// update()

// delete()
