import { describe, expect, it } from "vitest";
import { MemoryAccessStore, checkRateLimit, checkUserLimit, hashSecret, newOwnerToken } from "@/lib/access";

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

describe("account uploads", () => {
  it("count and list a user's certificates, newest first", async () => {
    const store = new MemoryAccessStore();
    await store.record({ proofId: "a", ownerHash: "o", ipHash: "i", userId: "u1", apiKeyId: "k1", createdAt: new Date(1000) });
    await store.record({ proofId: "b", ownerHash: "o", ipHash: "i", userId: "u1", apiKeyId: null, createdAt: new Date(3000) });
    await store.record({ proofId: "c", ownerHash: "o", ipHash: "i", userId: "u2", apiKeyId: null, createdAt: new Date(2000) });
    expect(await store.countUserSince("u1", new Date(0))).toBe(2);
    expect(await store.countUserSince("u1", new Date(2000))).toBe(1);
    expect((await store.userUploads("u1", new Date(0), 10)).map((u) => u.proofId)).toEqual(["b", "a"]);
    expect(await store.ownedByUser("a", "u1")).toBe(true);
    expect(await store.ownedByUser("a", "u2")).toBe(false);
  });
});

describe("checkUserLimit", () => {
  it("allows uploads until the monthly allowance is used", async () => {
    const store = new MemoryAccessStore();
    const now = new Date("2026-10-15T12:00:00Z");
    await store.record({ proofId: "a", ownerHash: "o", ipHash: "i", userId: "u1", apiKeyId: null, createdAt: new Date("2026-10-02T00:00:00Z") });
    await store.record({ proofId: "b", ownerHash: "o", ipHash: "i", userId: "u1", apiKeyId: null, createdAt: new Date("2026-09-30T23:00:00Z") });
    expect(await checkUserLimit(store, "u1", now, 2)).toBe(true);
    expect(await checkUserLimit(store, "u1", now, 1)).toBe(false);
  });
});
