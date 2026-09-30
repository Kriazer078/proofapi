import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MockAIProvider } from "@/lib/ai-provider";

const ai = new MockAIProvider();

describe("MockAIProvider", () => {
  it("scores the sample contract at 31 with three issues", async () => {
    const text = readFileSync("public/sample-contract.txt", "utf8");
    const result = await ai.analyze(text);
    expect(result.riskScore).toBe(31);
    expect(result.issues).toEqual(["Termination clause", "Liability risk", "Payment condition"]);
  });
  it("is deterministic", async () => {
    expect(await ai.analyze("termination and liability")).toEqual(await ai.analyze("termination and liability"));
  });
  it("returns zero risk for neutral text", async () => {
    const result = await ai.analyze("Hello world");
    expect(result.riskScore).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.summary).toBe("No notable risk factors found.");
  });
  it("adds a capped length factor", async () => {
    const text = "termination liability payment penalty indemnification confidential auto-renew ".repeat(500);
    expect((await ai.analyze(text)).riskScore).toBe(81);
  });
  it("identifies itself as a mock", () => {
    expect(ai.name).toBe("mock");
    expect(ai.model).toBe("proofapi-mock-v1");
  });
});
