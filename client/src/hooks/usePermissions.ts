import { useWorkspace } from "../context/WorkspaceContext";
import type { WorkspaceRole } from "../types/workspace";

const ROLE_LEVEL: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function usePermissions() {
  const { currentWorkspace } = useWorkspace();

  const role = currentWorkspace?.role ?? "VIEWER";
  const level = ROLE_LEVEL[role];

  const hasMinimumRole = (minimumRole: WorkspaceRole) => {
    return level >= ROLE_LEVEL[minimumRole];
  };

  return {
    role,

    canView: true,

    canCreateProject: hasMinimumRole("MEMBER"),
    canEditProject: hasMinimumRole("MEMBER"),
    canDeleteProject: hasMinimumRole("ADMIN"),

    canViewTasks: true,
    canCreateTask: hasMinimumRole("MEMBER"),
    canEditTask: hasMinimumRole("MEMBER"),
    canDeleteTask: hasMinimumRole("ADMIN"),

    canInviteMember: hasMinimumRole("ADMIN"),
    canRemoveMember: hasMinimumRole("ADMIN"),
    canChangeMemberRole: hasMinimumRole("ADMIN"),

    canEditWorkspace: hasMinimumRole("ADMIN"),
    canDeleteWorkspace: hasMinimumRole("OWNER"),
    canTransferOwnership: role === "OWNER",
  };
}