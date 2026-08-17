
| Table             | Columns                                 | Notes                                                                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| users             | id, name, email, created_at             | Primary key : id                                                                         |
| workspaces        | id, name, created_at                    | Primary key : id                                                                         |
| workspace_members | user_id, workspace_id, role, created_at | FK: user_id -> user.id                                 FK:  workspace_id -> workspace.id |

