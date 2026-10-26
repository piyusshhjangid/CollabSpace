# Contributing to CollabSpace

Thanks for considering a contribution. This guide explains how to find work, run the app locally, and submit a change that is straightforward to review.

## Find a piece of work

- Browse the open issues and choose one with a clear scope. Issues marked “good first issue” or “help wanted” are good starting points.
- Comment on an issue before beginning a substantial change so contributors do not duplicate work. Small typo and documentation fixes can go straight to a pull request.
- For a new feature or a broad design change, open an issue first and describe the user problem and proposed behavior.
- The Internship Engineering Handbook is a target specification. Check the current code and issue acceptance criteria; a feature described in the handbook may not exist yet.

## Set up the project

You need Git, Node.js with npm, and PostgreSQL. Redis is used for background jobs and some realtime/cache features; the local Compose file can start Redis when your contribution needs it.

Clone the repository:

~~~bash
git clone https://github.com/piyusshhjangid/CollabSpace.git
cd CollabSpace
~~~

Set up the server in one terminal:

~~~bash
cd server
npm ci
~~~

Copy server/.env.example to server/.env. On PowerShell, run:

~~~powershell
Copy-Item .env.example .env
~~~

Set DATABASE_URL to your local PostgreSQL database and set JWT_SECRET to a long, random local value. Never commit server/.env or paste secrets into an issue or pull request. Apply migrations, then start the API:

~~~bash
npx prisma migrate deploy
npm run dev
~~~

Set up the client in a second terminal:

~~~bash
cd client
npm ci
npm run dev
~~~

For work involving Redis or the notification worker, start Redis from the repository root with docker compose up -d redis. The worker also needs SMTP settings; see server/.env.example.

## Make and verify a change

- Create a focused branch from main. Use a prefix such as feat/, fix/, docs/, or test/.
- Keep the change limited to one issue when possible. Include the issue number in the pull request description.
- Preserve workspace isolation and permission checks on every server-side resource path. Do not trust a workspace or user ID supplied by the client as authorization.
- If a change affects API input, database structure, or user-visible behavior, update the relevant validation, migration, documentation, and UI together.
- Run the checks relevant to your change before opening a pull request:

~~~bash
cd server
npm test
npx tsc --noEmit
~~~

~~~bash
cd client
npm test
npm run lint
npm run build
~~~

If a check cannot run because a local service or credential is unavailable, say which check was skipped and why. Do not include secrets, real user data, or production credentials in test output.

## Open a pull request

- Explain the user problem and the change.
- Link the related issue with “Closes #123” when the pull request completes it.
- Include relevant test results and screenshots for user-interface changes.
- Call out database migrations, configuration changes, security impact, and follow-up work.
- Keep the pull request focused and update it in response to review.

By submitting a contribution, you agree that it will be distributed under the repository's MIT license. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

