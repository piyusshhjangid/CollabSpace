import type { Role } from "../types/role.js";
import { ROLE_LEVEL } from "../types/role.js";

export function canManageResource(
  role: Role,
  userId: string,
  ownerUserId: string | null | undefined,
): boolean {
  if (ROLE_LEVEL[role] >= ROLE_LEVEL.ADMIN) {
    return true;
  }

  return ownerUserId === userId;
}