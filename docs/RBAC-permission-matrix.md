\# CollabSpace RBAC Permission Matrix



\## Source of truth



Workspace authorization is based on:



`workspace\_members.role`



The four fixed application roles are:



\- OWNER

\- ADMIN

\- MEMBER

\- VIEWER



No custom/configurable roles are planned for CollabSpace.



> Note: the current Prisma schema stores `workspace\_members.role` as a String with a default of `"member"`. Application code must use one consistent representation of the four roles.



\## Permission Matrix



| Action | OWNER | ADMIN | MEMBER | VIEWER |

|---|---:|---:|---:|---:|

| View workspace | ✅ | ✅ | ✅ | ✅ |

| View projects | ✅ | ✅ | ✅ | ✅ |

| Create project | ✅ | ✅ | ✅ | ❌ |

| Edit project | ✅ | ✅ | ✅ | ❌ |

| Delete project | ✅ | ✅ | ❌ | ❌ |

| View tasks | ✅ | ✅ | ✅ | ✅ |

| Create task | ✅ | ✅ | ✅ | ❌ |

| Edit task | ✅ | ✅ | ✅ | ❌ |

| Delete task | ✅ | ✅ | ❌ | ❌ |

| Invite member | ✅ | ✅ | ❌ | ❌ |

| Remove member | ✅ | ✅ | ❌ | ❌ |

| Change member role | ✅ | ✅ | ❌ | ❌ |

| View members | ✅ | ✅ | ✅ | ✅ |

| Edit workspace | ✅ | ✅ | ❌ | ❌ |

| Delete workspace | ✅ | ❌ | ❌ | ❌ |

| Transfer ownership | ✅ | ❌ | ❌ | ❌ |



\## Role principles



\### OWNER

Full control of the workspace.



\### ADMIN

Can administer members and manage workspace content, but cannot

delete the workspace or transfer ownership.



\### MEMBER

Can actively collaborate on projects and tasks, but cannot manage

workspace membership or perform destructive administrative actions.



\### VIEWER

Read-only access to workspace content.



\## Authorization rule



Permissions must be checked using the authenticated user's

`workspace\_members.role` for the requested workspace.



Do not determine authorization from frontend state.



Do not determine authorization from project/task ownership alone.



All workspace-scoped actions must first establish workspace membership

and role, then apply the permission matrix.



\## Principle of least privilege



Each role receives only the permissions required for its intended level

of access.

