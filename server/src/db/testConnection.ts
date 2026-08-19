import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    await client.connect();

    const result = await client.query("SELECT 1");

    console.log("PostgreSQL connected!");
    console.log(result.rows);

    await client.end();
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
  }
}

testConnection();