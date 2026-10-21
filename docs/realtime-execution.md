# Live execution graph (Days 57–60)

## Trust boundary

Socket.IO shares the HTTP server. The handshake accepts the existing short-lived JWT through Socket.IO's `auth` payload and verifies the signature and expiry. A socket begins with no workspace subscription. `workspace:join` accepts only a workspace id, then checks the authenticated user against `workspace_members` before joining the server-owned `workspace:<id>` room. The client cannot choose a raw room name or publish execution events.

## Event contract

Task create/update and dependency create/delete increment a PostgreSQL workspace sequence and emit only `{ sequence, resource, action, id }`. The payload contains no task title or private workspace data. REST and PostgreSQL remain authoritative; socket messages are cache invalidation hints.

## Ordering and recovery

The counter is advanced atomically with `upsert + increment`, so concurrent writes receive distinct monotonically increasing sequence values. The graph endpoint returns the current workspace sequence with a fresh snapshot. The browser subscribes again after every reconnect and refetches the graph; each change also invalidates the graph query. This intentionally uses a snapshot to heal missed messages rather than relying on Socket.IO as an event store.

The client tracks a visible live/reconnecting state. If the socket is unavailable, the graph remains usable through normal HTTP reads and mutations. Realtime is an enhancement and never replaces API validation or server authorization.

## Operational boundary

This first version uses Socket.IO's in-memory room adapter and one application process. Horizontal multi-instance delivery requires a shared adapter (for example Redis) and belongs to the next roadmap phase; PostgreSQL remains the durable sequence source either way.
