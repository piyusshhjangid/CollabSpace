export const ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LEVEL: Record<Role, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function normalizeRole(role: string): Role | null {
  const normalized = role.toUpperCase();

  if (
    normalized === "OWNER" ||
    normalized === "ADMIN" ||
    normalized === "MEMBER" ||
    normalized === "VIEWER"
  ) {
    return normalized;
  }

  return null;
}