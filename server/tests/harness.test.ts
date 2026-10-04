import { describe, expect, it } from "vitest";
import { prisma } from "./setup.js";

describe("test harness", () => {
  it("connects to the isolated test database", async () => {
    const result = await prisma.$queryRaw<{ current_database: string }[]>`
      SELECT current_database()
    `;

    expect(result[0]?.current_database).toBe("collabspace_test");
  });
});
