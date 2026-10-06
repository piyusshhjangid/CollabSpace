# CollabSpace Permission Matrix

## Purpose

The permission matrix is the application-level source of truth for workspace authorization.

Authorization follows:

```text
Request
  ↓
Authentication
  ↓
Workspace membership/context
  ↓
Permission matrix
  ↓
Resource ownership / business rules
  ↓
Controller
  ↓
Service
  ↓
Repository / Prisma
```

The matrix is implemented in:

```text
src/policy/permissionMatrix.ts
```

Authorization middleware is implemented in:

```text
src/middleware/requirePermission.ts
```

---

## Role Matrix

| Action | OWNER | ADMIN | MEMBER | VIEWER |
|---|:---:|:---:|:---:|:---:|
| VIEW | ✅ | ✅ | ✅ | ✅ |
| DELETE_WORKSPACE | ✅ | ❌ | ❌ | ❌ |
| INVITE_MEMBERS | ✅ | ✅ | ❌ | ❌ |
| CREATE_PROJECT | ✅ | ✅ | ✅ | ❌ |
| DELETE_PROJECT | ✅ | ✅ | ❌ | ❌ |
| CREATE_TASK | ✅ | ✅ | ✅ | ❌ |
| UPDATE_OWN_TASK | ✅ | ✅ | ✅ | ❌ |
| REMOVE_MEMBER | ✅ | ✅ | ❌ | ❌ |

---

## Authorization Rules

### OWNER

The workspace owner can:

- View workspace resources
- Delete the workspace
- Invite members
- Create projects
- Delete projects
- Create tasks
- Update tasks
- Remove members

### ADMIN

An administrator can:

- View workspace resources
- Invite members
- Create projects
- Delete projects
- Create tasks
- Update tasks
- Remove members

An administrator cannot delete the workspace.

### MEMBER

A member can:

- View workspace resources
- Create projects
- Create tasks
- Update tasks they are authorized to manage

A member cannot:

- Invite members
- Delete projects
- Remove members
- Delete the workspace

### VIEWER

A viewer has read access only.

A viewer cannot:

- Create projects
- Create tasks
- Update tasks
- Delete projects
- Invite members
- Remove members
- Delete the workspace

---

## Resource-Level Defense in Depth

The permission matrix answers:

> "Is this role allowed to perform this class of action?"

Resource authorization additionally answers:

> "Is this specific resource owned by or otherwise manageable by this user?"

This means the matrix does not replace resource-level checks.

For example:

```text
VIEWER + assigned task
        ↓
permission denied
```

A viewer being assigned to a task does not grant write permission.

Similarly, lower-level resource ownership checks remain useful as defense in depth.

---

## Testing Strategy

The security test suite verifies:

- Every role exists for every permission action.
- Read access is available to all workspace roles.
- Workspace deletion is owner-only.
- Invitations are owner/admin only.
- Project creation is owner/admin/member.
- Task creation is owner/admin/member.
- Viewer write access is denied.
- Member removal is owner/admin only.
- Privilege escalation attempts are rejected.
- Cross-tenant resource access is rejected.
- Token replay and invalid token scenarios are rejected.

Relevant tests:

```text
tests/security/rbac.test.ts
tests/security/rbac-escalation.test.ts
tests/security/tenant.test.ts
tests/security/tokens.test.ts
```

The matrix should be updated before introducing a new protected action rather than adding arbitrary role checks directly inside route handlers.
