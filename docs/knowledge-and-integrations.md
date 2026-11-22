# Knowledge and external integrations

## Workspace knowledge

Documents are stored in PostgreSQL with a content hash, source metadata, and ordered text chunks. Duplicate content within a workspace is idempotent. Deleting a document cascades to its chunks. URLs entered in the library are references only; the server does not fetch arbitrary URLs.

Search always constrains both chunk and parent document by the authenticated workspace before ranking. It uses PostgreSQL English full-text search by default. If the optional pgvector extension is available and `GEMINI_EMBEDDING_API_KEY` is configured, the server also generates 768-dimensional Gemini embeddings and uses a hybrid cosine/full-text score. Semantic ranking scans only the current workspace's indexed rows, rather than using a global nearest-neighbor index that could choose candidates from another tenant first.

Embedding setup is opt-in. Text sent for embedding is sent to Google's Gemini API using the configured API key. Without that key, or when pgvector is unavailable, the library remains usable through full-text search. Embedding provider failures do not prevent document storage. The Gemini Embeddings REST method and task-type formats are documented by [Google AI for Developers](https://ai.google.dev/gemini-api/docs/embeddings).

Retrieved passages are shown with document and chunk IDs. No generative answer is returned today.

## OAuth integrations

The supported provider adapters are Jira Cloud, Linear, GitLab, and Slack:

- Jira and Linear sync a bounded page of recent issues into project activity.
- GitLab syncs issues and project pipelines into project activity when a project reference is provided.
- Slack sends a compact delivery digest for the selected CollabSpace project.

Issue and pipeline imports are read-only. CollabSpace does not create, edit, or close provider tasks. External activity is kept separate from local task state.

The authorization flow stores only a hash of a random, single-use OAuth `state` value, expires it after ten minutes, and checks it during the callback. Provider access and refresh tokens are encrypted with AES-256-GCM using `INTEGRATION_ENCRYPTION_KEY`. The encryption key must be private and stable across restarts. Provider client secrets are environment variables and never stored in the database. Do not log tokens, authorization codes, or callback query strings.

Use a public HTTPS callback URL for deployed apps. The callback is:

```text
{PUBLIC_SERVER_URL}/api/integrations/oauth/{provider}/callback
```

Set `{PROVIDER}_CLIENT_ID`, `{PROVIDER}_CLIENT_SECRET`, and the exact registered `{PROVIDER}_REDIRECT_URI` for each provider. Jira, Linear, and GitLab request read scopes; Slack requests `chat:write` for the explicit digest action.

## Durable work

Sync requests are inserted into the PostgreSQL `integration_sync_jobs` outbox and acknowledged with HTTP 202. A worker claims work with row locking, deduplicates imported activity by provider external ID, retries transient failures with bounded backoff, and marks exhausted work dead. The recovery queue uses the same durable database pattern.

Run workers locally with:

```powershell
cd server
npm run worker:integrations
npm run worker:recovery
```

The local Docker Compose `app` profile starts separate worker containers. The free Render demo runs these workers beside the API in one service process; work is durable in Postgres, but Render can pause the entire service while idle.

## Configuration

See `server/.env.example` for local variable names. Keep real secrets in local ignored `.env` files or the hosting provider's secret manager. Never commit OAuth secrets or embedding API keys.
