import "dotenv/config";
import pg from "pg";

const source = process.env.DATABASE_URL;

if (!source) {
  throw new Error("DATABASE_URL is missing from .env");
}

const sourceUrl = new URL(source);
const sourceDb = decodeURIComponent(
  sourceUrl.pathname.replace(/^\/+/, "")
);

if (
  !["localhost", "127.0.0.1", "::1"].includes(sourceUrl.hostname) ||
  sourceDb !== "collabspace"
) {
  throw new Error(
    "Refusing to modify database: expected local collabspace database."
  );
}

const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/postgres";
adminUrl.search = "";
adminUrl.hash = "";

const client = new pg.Client({
  connectionString: adminUrl.toString(),
});

await client.connect();

try {
  await client.query(`
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'collabspace_test'
      AND pid <> pg_backend_pid()
  `);

  await client.query('DROP DATABASE IF EXISTS "collabspace_test"');
  await client.query('CREATE DATABASE "collabspace_test"');

  console.log("Recreated collabspace_test.");
} finally {
  await client.end();
}
