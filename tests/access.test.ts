import { describe, expect, it } from "vitest";
import { MemoryAccessStore, checkRateLimit, hashSecret, newOwnerToken } from "@/lib/access";

const HOUR = 3600_000;
const limits = { perIpPerHour: 2, perDay: 3 };

describe("owner tokens", () => {
  it("are random and only their hash is stored", () => {
    const a = newOwnerToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(newOwnerToken()).not.toBe(a);
    expect(hashSecret(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSecret(a)).not.toBe(a);
  });
});

describe("MemoryAccessStore", () => {
  it("knows who created a proof", async () => {
    const store = new MemoryAccessStore();
    await store.record({ proofId: "p1", ownerHash: "o1", ipHash: "i1", createdAt: new Date(0) });
    expect(await store.owns("p1", "o1")).toBe(true);
    expect(await store.owns("p1", "o2")).toBe(false);
    expect(await store.owns("p2", "o1")).toBe(false);
    expect(await store.ownedIds("o1")).toEqual(["p1"]);
  });
});

describe("checkRateLimit", () => {
  it("allows uploads under both limits", async () => {
    const store = new MemoryAccessStore();
    expect(await checkRateLimit(store, "ip", new Date(10 * HOUR), limits)).toBe(true);
  });

  it("blocks one address after its hourly limit and lets it back an hour later", async () => {
    const store = new MemoryAccessStore();
    const now = 10 * HOUR;
    await store.record({ proofId: "a", ownerHash: "o", ipHash: "ip", createdAt: new Date(now - 10) });
    await store.record({ proofId: "b", ownerHash: "o", ipHash: "ip", createdAt: new Date(now - 5) });
    expect(await checkRateLimit(store, "ip", new Date(now), limits)).toBe(false);
    expect(await checkRateLimit(store, "other-ip", new Date(now), limits)).toBe(true);
    expect(await checkRateLimit(store, "ip", new Date(now + HOUR), limits)).toBe(true);
  });

  it("caps the whole site per day to protect the server wallet", async () => {
    const store = new MemoryAccessStore();
    const now = 30 * HOUR;
    for (const [i, ip] of ["x", "y", "z"].entries()) {
      await store.record({ proofId: ip, ownerHash: "o", ipHash: ip, createdAt: new Date(now - i * HOUR) });
    }
    expect(await checkRateLimit(store, "fresh", new Date(now), limits)).toBe(false);
    expect(await checkRateLimit(store, "fresh", new Date(now + 25 * HOUR), limits)).toBe(true);
  });
});
