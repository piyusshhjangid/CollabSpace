import type { Workspace } from "../types/workspace";

export const fakeWorkspaces: Workspace[] = [
  {
    id: 1,
    name: "CollabSpace",
    role: "OWNER",
  },
  {
    id: 2,
    name: "BuildOS",
    role: "ADMIN",
  },
  {
    id: 3,
    name: "Portfolio",
    role: "MEMBER",
  },
];