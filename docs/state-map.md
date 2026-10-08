# CollabSpace Frontend State Map

## State Ownership Rule

CollabSpace separates state into three categories:

1. Local component state  
2. Client-global state  
3. Server state  

**Core rule:**  
> Redux stores client-owned state. TanStack Query stores server-owned state. Local component state stays local unless it needs to be shared.

---

## 1. Local Component State

State that belongs only to one component should remain with that component.

| State | Current location | Decision | Reason |
|---|---|---|---|
| Task form fields | `components/board/TaskModal.tsx` | Local | Only the modal owns the temporary form |
| Task validation error | `components/board/TaskModal.tsx` | Local | Only the modal needs it |
| Board filters | `components/board/ProjectBoard.tsx` | Local | Filters currently belong to the board |
| Dragged task | `components/board/ProjectBoard.tsx` | Local | Temporary drag interaction |
| Workspace switcher dropdown open | `components/layout/WorkspaceSwitcher.tsx` | Local | Pure UI state |
| Search input | Page/component state | Local | UI interaction state |

---

## 2. Client-Global State — Redux Toolkit

State that belongs to the client application and may be needed by multiple unrelated components belongs in Redux.

| State | Current location | Target | Reason |
|---|---|---|---|
| Current workspace selection | `context/WorkspaceContext.tsx` | Redux | Shared application-level selection |
| Task modal open/closed | `ProjectBoard.tsx` | Redux | UI state that may later be controlled from multiple surfaces |
| Selected task ID | `ProjectBoard.tsx` | Redux | Shared UI selection; store the ID, not a server-data copy |

**Redux must NOT contain:**
- Projects  
- Tasks  
- Members  
- Workspace lists  
- API loading states  
- API error states  
- Server responses  
- Cached server data  

---

## 3. Server State — TanStack Query

Server-owned data belongs in TanStack Query.

| Data | Current location | Target | Query key |
|---|---|---|---|
| Projects | `ProjectPage.tsx` local state + API | TanStack Query | `["projects", workspaceId]` |
| Tasks | `ProjectBoard.tsx` + fake API | TanStack Query | `["tasks", workspaceId]` |
| Members | API/server data | TanStack Query | `["members", workspaceId]` |
| Workspaces | `Shell.tsx` local state | TanStack Query | `["workspaces"]` |
| Workspace-specific role/membership | workspace API state | TanStack Query | `["workspace", workspaceId]` |

---

## 4. Query Key Rule

Every workspace-scoped server query must include the workspace ID.

Example:

```ts
["projects", workspaceId]
["tasks", workspaceId]
["members", workspaceId]
The workspace ID is part of the identity of the cached data. Without it, data from one workspace could be reused for another.

5. Why Workspace-Aware Query Keys Matter
Viewing Workspace A with query key ["projects"] caches its projects.

Switching to Workspace B with the same key ["projects"] reuses Workspace A’s cache incorrectly.

Correct approach:

["projects", "workspace-a"]

["projects", "workspace-b"]

These are independent cache entries.

6. Loading and Error States
Server loading and error states belong to TanStack Query.
Do not duplicate:

ts
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
TanStack Query already provides:

isPending

isLoading

isError

error

data

7. Current Architecture Problems
The frontend currently mixes server and client state:

ProjectPage fetches projects and copies them into useState.

ProjectBoard reads fake task data and copies it into boardTasks.

Shell fetches workspaces and stores the server response in local state.

WorkspaceContext contains both workspace selection and workspace data.

TaskModal correctly keeps temporary form state local.

Board filters correctly remain local UI state.

8. Target Architecture
Code
                 React UI
                    |
          +---------+---------+
          |                   |
     Redux Toolkit       TanStack Query
          |                   |
    Client state          Server state
          |                   |
    currentWorkspace     projects
    modal state          tasks
    selectedTaskId       members
                         workspaces
          |                   |
          +---------+---------+
                    |
                API layer
                    |
                Express API
9. Important Rule
Never copy server data into Redux merely because a component needs it.
If the backend owns it, TanStack Query owns the client cache.
Redux should contain decisions and UI state owned by the browser, not a second copy of PostgreSQL data.

10. Completion Criteria
[ ] State map documented

[ ] Redux Toolkit installed

[ ] TanStack Query installed

[ ] No projects/tasks/members stored in Redux

[ ] Workspace ID included in workspace-scoped query keys

[ ] API loading/error handling moves toward TanStack Query

[ ] Task modal begins using real query data

[ ] Workspace switching cannot reuse another workspace’s server cache

