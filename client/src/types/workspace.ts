export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Workspace {
  id: number;
  name: string;
  role: WorkspaceRole;
}
