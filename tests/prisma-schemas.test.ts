import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const models = (path: string) => readFileSync(path, "utf8").replace(/\r/g, "").split("\nmodel ").slice(1).join("\nmodel ");

describe("Prisma schemas", () => {
  it("define the same models for local SQLite and hosted Postgres", () => {
    expect(models("prisma/schema.postgres.prisma")).toBe(models("prisma/schema.prisma"));
    expect(readFileSync("prisma/schema.postgres.prisma", "utf8")).toMatch(/provider\s+=\s+"postgresql"/);
  });
});
