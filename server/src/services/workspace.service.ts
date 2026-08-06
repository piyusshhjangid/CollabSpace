import { findAllWorkspaces } from "../repositories/workspace.repository.js";

export async function getAllWorkspaces() {
  return await findAllWorkspaces();
}