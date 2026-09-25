# CollabSpace RBAC Permission Matrix

## 1. Purpose

This document defines the authorization model for **CollabSpace**.

It establishes the permissions associated with each workspace role so that authorization decisions remain consistent, predictable, and auditable across the application.

CollabSpace uses four fixed workspace roles:

* **OWNER**
* **ADMIN**
* **MEMBER**
* **VIEWER**

Custom or configurable roles are not part of the current CollabSpace design.

---

## 2. Source of Truth

The authoritative source for workspace authorization is:

```text
workspace_members.role
```

A user's permissions must always be determined from their role in the **specific workspace being accessed**.

The frontend must not be treated as an authorization source.

Likewise, project ownership or task ownership must not replace workspace-level authorization.

### Current database representation

The current Prisma schema stores the role as:

```text
workspace_members.role
```

with type:

```text
String
```

and default value:

```text
"member"
```

Application code must use one consistent representation for the four supported roles.

---

# 3. Permission Matrix

| Action             | OWNER | ADMIN | MEMBER | VIEWER |
| ------------------ | :---: | :---: | :----: | :----: |
| View workspace     |   ✅   |   ✅   |    ✅   |    ✅   |
| View members       |   ✅   |   ✅   |    ✅   |    ✅   |
| View projects      |   ✅   |   ✅   |    ✅   |    ✅   |
| Create project     |   ✅   |   ✅   |    ✅   |    ❌   |
| Edit project       |   ✅   |   ✅   |    ✅   |    ❌   |
| Delete project     |   ✅   |   ✅   |    ❌   |    ❌   |
| View tasks         |   ✅   |   ✅   |    ✅   |    ✅   |
| Create task        |   ✅   |   ✅   |    ✅   |    ❌   |
| Edit task          |   ✅   |   ✅   |    ✅   |    ❌   |
| Delete task        |   ✅   |   ✅   |    ❌   |    ❌   |
| Invite member      |   ✅   |   ✅   |    ❌   |    ❌   |
| Remove member      |   ✅   |   ✅   |    ❌   |    ❌   |
| Change member role |   ✅   |   ✅   |    ❌   |    ❌   |
| Edit workspace     |   ✅   |   ✅   |    ❌   |    ❌   |
| Delete workspace   |   ✅   |   ❌   |    ❌   |    ❌   |
| Transfer ownership |   ✅   |   ❌   |    ❌   |    ❌   |

---

# 4. Role Definitions

## 4.1 OWNER

The **OWNER** has full control over the workspace.

### Permissions

* View and manage workspace content
* Create, edit, and delete projects
* Create, edit, and delete tasks
* Invite and remove members
* Change member roles
* Edit workspace settings
* Delete the workspace
* Transfer workspace ownership

The OWNER has the highest level of authority within the workspace.

---

## 4.2 ADMIN

The **ADMIN** can manage workspace members and day-to-day workspace content.

### Permissions

* View workspace and members
* Create, edit, and delete projects
* Create, edit, and delete tasks
* Invite members
* Remove members
* Change member roles
* Edit workspace settings

### Restrictions

An ADMIN cannot:

* Delete the workspace
* Transfer workspace ownership

These actions remain restricted to the OWNER.

---

## 4.3 MEMBER

The **MEMBER** represents a normal collaborative user.

### Permissions

* View the workspace
* View members
* View projects
* Create projects
* Edit projects
* View tasks
* Create tasks
* Edit tasks

### Restrictions

A MEMBER cannot:

* Delete projects
* Delete tasks
* Invite members
* Remove members
* Change member roles
* Edit workspace settings
* Delete the workspace
* Transfer ownership

---

## 4.4 VIEWER

The **VIEWER** has read-only access to the workspace.

### Permissions

* View the workspace
* View members
* View projects
* View tasks

### Restrictions

A VIEWER cannot:

* Create or edit projects
* Delete projects
* Create or edit tasks
* Delete tasks
* Invite members
* Remove members
* Change member roles
* Edit workspace settings
* Delete the workspace
* Transfer ownership

---

# 5. Authorization Rules

All workspace-scoped operations must follow this sequence:

```text
Request
   ↓
Authenticate user
   ↓
Identify requested workspace
   ↓
Find workspace_members record
   ↓
Verify membership
   ↓
Read workspace_members.role
   ↓
Check requested action against RBAC matrix
   ↓
Allow or reject operation
```

### Rule 1 — Authentication comes first

A request must contain a valid authenticated user.

Invalid, missing, expired, or tampered authentication credentials must be rejected.

### Rule 2 — Membership comes before permission

A user must belong to the requested workspace before their role can be evaluated.

A user who is not a workspace member must not receive workspace data or perform workspace actions.

### Rule 3 — Role comes from the database

The user's role must come from:

```text
workspace_members.role
```

Do not trust:

* Frontend state
* Request body role values
* Query parameters claiming a role
* Client-side permission checks

### Rule 4 — Apply the matrix consistently

Every protected workspace action must map to exactly one permission defined in this document.

Authorization logic should not be independently invented inside individual endpoints.

### Rule 5 — Least privilege

A role should receive only the permissions required for its intended responsibilities.

---

# 6. Security Model

CollabSpace separates **authentication** from **authorization**.

### Authentication

Answers:

> Who is making the request?

Implemented using:

* JWT access tokens
* Refresh tokens
* Authentication middleware

### Authorization

Answers:

> What is this authenticated user allowed to do in this workspace?

Implemented using:

* Workspace membership
* `workspace_members.role`
* The permission matrix defined in this document

Therefore:

```text
Authentication ≠ Authorization
```

A valid JWT alone does **not** grant access to every workspace.

---

# 7. Example Authorization Decisions

| Scenario                                           | Expected Result |
| -------------------------------------------------- | --------------- |
| OWNER deletes a project                            | ✅ Allowed       |
| ADMIN deletes a project                            | ✅ Allowed       |
| MEMBER deletes a project                           | ❌ Forbidden     |
| VIEWER creates a task                              | ❌ Forbidden     |
| MEMBER creates a task                              | ✅ Allowed       |
| ADMIN invites a member                             | ✅ Allowed       |
| MEMBER invites a member                            | ❌ Forbidden     |
| ADMIN deletes the workspace                        | ❌ Forbidden     |
| OWNER transfers ownership                          | ✅ Allowed       |
| Authenticated user outside workspace requests data | ❌ Forbidden     |
| Unauthenticated user requests protected data       | ❌ Unauthorized  |

---

# 8. Implementation Principle

The permission matrix is the **authorization contract** for Phase 5.

Future RBAC middleware and service-layer checks must implement this matrix rather than defining permissions independently per endpoint.

The database membership record remains the source of truth for the user's role within each workspace.

---

## 9. Scope of Current RBAC Design

This design intentionally uses only four fixed roles:

```text
OWNER
ADMIN
MEMBER
VIEWER
```

Custom roles, user-defined permissions, permission inheritance, and configurable role management are outside the current scope of CollabSpace.
