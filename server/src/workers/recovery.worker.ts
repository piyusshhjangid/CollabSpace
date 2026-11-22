import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { claimRecoveryJob } from "../repositories/recovery.repository.js";
import { executeRecoveryJob } from "../services/recovery.service.js";

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

console.info("Recovery worker ready; polling the durable PostgreSQL outbox.");
while (!stopping) {
  try {
    const job = await claimRecoveryJob();
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    await executeRecoveryJob(job).catch((error: unknown) => console.error("Recovery job failed and was scheduled for retry", error instanceof Error ? error.name : "UnknownError"));
  } catch (error) {
    console.error("Recovery worker poll failed", error instanceof Error ? error.name : "UnknownError");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

await prisma.$disconnect();
