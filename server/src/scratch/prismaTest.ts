import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const tasks = await prisma.tasks.findMany({
  where: {
    project_id: "c0dad3ec-0e54-4198-a254-ec5cb7b0e7f8",
  },
});
  console.log(tasks);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });