# CollabSpace ER Diagram — v2

## Scope

This diagram documents the current relational model relevant to the Day 48 security baseline.

```mermaid
erDiagram
    users ||--o{ workspace_members : belongs_to
    workspaces ||--o{ workspace_members : has
    workspaces ||--o{ projects : contains
    workspaces ||--o{ tasks : contains
    projects ||--o{ tasks : contains
    users ||--o{ tasks : assigned_to
    tasks ||--o{ task_status_history : records
    workspaces ||--o{ invitations : owns
    users ||--o{ invitations : creates
    workspaces ||--o{ audit_log : records
    users ||--o{ audit_log : performs

    users {
        uuid id PK
        string email
        string password_hash
        string name
        datetime created_at
        datetime updated_at
    }

    workspaces {
        uuid id PK
        string name
        uuid owner_id
        datetime created_at
        datetime updated_at
    }

    workspace_members {
        uuid id PK
        uuid workspace_id FK
        uuid user_id FK
        string role
        datetime created_at
        datetime updated_at
    }

    projects {
        uuid id PK
        uuid workspace_id FK
        string name
        string description
        uuid owner_id
        datetime created_at
        datetime updated_at
    }

    tasks {
        uuid id PK
        uuid workspace_id FK
        uuid project_id FK
        uuid assignee_id FK
        string title
        string description
        string status
        string priority
        datetime due_date
        datetime completed_at
        datetime created_at
        datetime updated_at
    }

    task_status_history {
        uuid id PK
        uuid task_id FK
        string from_status
        string to_status
        uuid changed_by
        datetime created_at
    }

    invitations {
        uuid id PK
        uuid workspace_id FK
        uuid invited_by FK
        string email
        string role
        string status
        datetime expires_at
        datetime created_at
    }

    audit_log {
        uuid id PK
        uuid workspace_id
        uuid actor_id
        string action
        string target_type
        string target_id
        json metadata
        datetime created_at
    }
```

## Audit Log Design

`audit_log` records security-sensitive and operationally important actions.

Important properties:

- `workspace_id` scopes the event to a workspace when applicable.
- `actor_id` identifies the user responsible for the action when available.
- `action` identifies the event.
- `target_type` identifies the affected resource category.
- `target_id` identifies the affected resource when applicable.
- `metadata` stores structured contextual information.
- `created_at` records event time.

Indexes:

```text
(workspace_id, created_at)
(actor_id, created_at)
(action, created_at)
```

These indexes support workspace timelines, actor activity, and action-oriented investigations.

## Audit Events

Current application audit events include:

```text
AUTH_REGISTER
AUTH_LOGIN
AUTH_LOGOUT

WORKSPACE_CREATED
WORKSPACE_DELETED

MEMBER_REMOVED

INVITATION_CREATED
INVITATION_ACCEPTED

PROJECT_CREATED
PROJECT_DELETED

TASK_CREATED
TASK_UPDATED
```

There is currently no role-change endpoint or task-delete endpoint in the application, so those actions are not logged as application events yet.

## Metadata Security

Audit metadata is sanitized before persistence.

Sensitive keys such as:

```text
password
token
secret
authorization
cookie
jwt
refresh
access
apiKey
credential
```

are replaced with:

```text
[REDACTED]
```

Bearer-token-shaped and JWT-shaped string values are also redacted.

The audit tests verify that raw secret values do not reach persisted metadata.
