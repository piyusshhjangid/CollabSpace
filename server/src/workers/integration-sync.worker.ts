import "dotenv/config";
import { prisma } from "../db/prisma.js";
import { claimIntegrationSyncJob, finishIntegrationSyncJob } from "../repositories/integration.repository.js";
import { runIntegrationSync } from "../services/integrations.service.js";

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

console.info("Integration sync worker ready; polling the durable PostgreSQL outbox.");
while (!stopping) {
  try {
    const job = await claimIntegrationSyncJob();
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    try {
      const result = await runIntegrationSync(job);
      await finishIntegrationSyncJob(job.id, job.workspace_id, result);
    } catch (error) {
      console.error("Integration sync failed and was scheduled for retry", error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : "INTEGRATION_SYNC_FAILED");
    }
  } catch (error) {
    console.error("Integration sync worker poll failed", error instanceof Error ? error.name : "UnknownError");
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

await prisma.$disconnect();
