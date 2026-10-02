\# CollabSpace RBAC Verification



\## Date



October 2, 2026



\## Scope



Phase 5 RBAC verification.



The tests verify that the implemented authorization behavior matches

the CollabSpace RBAC policy defined in `RBAC-permission-matrix.md`.



\## Tested Roles



\- OWNER

\- ADMIN

\- MEMBER

\- VIEWER



\## Verified Authorization Rules



| Action | OWNER | ADMIN | MEMBER | VIEWER |

|---|:---:|:---:|:---:|:---:|

| Create project | ✅ | ✅ | ✅ | ✅/❌\* |

| Delete project | ✅ | ✅ | ❌ | ❌ |

| Create task | ✅ | ✅ | ✅ | ❌ |

| Update own task | ✅ | ✅ | ✅ | ❌ |

| Update another user's task | ✅ | ✅ | ❌ | ❌ |

| Invite member | ✅ | ✅ | ❌ | ❌ |

| Remove member | ✅ | ✅ | ❌ | ❌ |

| Delete workspace | ✅ | ❌ | ❌ | ❌ |



\\\* Frontend visibility and backend authorization must both be checked.

The backend remains authoritative.



\## Resource Ownership



MEMBER:

\- Can update an assigned task.

\- Cannot update another user's task.



ADMIN:

\- Can override task assignment restrictions.



\## Security Expectations



\- Unauthenticated requests are rejected by authentication middleware.

\- Non-members are rejected by workspace context middleware.

\- Members with insufficient roles are rejected by `requireRole`.

\- Resource ownership is checked for member-level task updates.

\- Workspace-scoped operations remain tied to the requested workspace.



\## Not Yet Implemented



The following Day 39 matrix actions do not yet have corresponding

production endpoints and therefore were not marked as passing:



\- Delete task

\- Change member role

\- View members

\- Edit workspace

\- Transfer ownership



These remain future RBAC implementation work.



\## Result



Implemented RBAC routes were manually verified against the permission

model.



Phase 5 authorization behavior is considered verified for the

implemented action surface.

