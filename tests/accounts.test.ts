import { describe, expect, it } from "vitest";
import { MemoryAccountStore, keyFromHeader, newApiKey } from "@/lib/accounts";
import { hashSecret } from "@/lib/access";

describe("API keys", () => {
  it("have a recognisable prefix and are never stored in plain text", () => {
    const { full, record } = newApiKey("user-1", "prod-agent", new Date(0));
    expect(full).toMatch(/^pk_live_[0-9a-f]{48}$/);
    expect(record.keyHash).toBe(hashSecret(full));
    expect(JSON.stringify(record)).not.toContain(full);
    expect(record.last4).toBe(full.slice(-4));
  });

  it("are read only from a Bearer header in the right format", () => {
    expect(keyFromHeader("Bearer pk_live_" + "a".repeat(48))).toBe("pk_live_" + "a".repeat(48));
    expect(keyFromHeader("bearer pk_live_" + "a".repeat(48))).toBe("pk_live_" + "a".repeat(48));
    expect(keyFromHeader("Bearer something-else")).toBeNull();
    expect(keyFromHeader(null)).toBeNull();
  });
});

describe("MemoryAccountStore", () => {
  it("creates one user per GitHub account and updates the profile", async () => {
    const store = new MemoryAccountStore();
    const a = await store.upsertGithubUser({ githubId: "42", login: "aidar", name: "Aidar", avatarUrl: null });
    const b = await store.upsertGithubUser({ githubId: "42", login: "aidar-k", name: "Aidar K", avatarUrl: "x" });
    expect(b.id).toBe(a.id);
    expect(b.login).toBe("aidar-k");
  });

  it("finds active keys by hash, records use, and forgets revoked keys", async () => {
    const store = new MemoryAccountStore();
    const user = await store.upsertGithubUser({ githubId: "1", login: "u", name: null, avatarUrl: null });
    const { full, record } = await store.createKey(user.id, "prod");
    expect(await store.findActiveKey(hashSecret(full))).toMatchObject({ id: record.id, userId: user.id });
    await store.touchKey(record.id, new Date(5));
    expect((await store.listKeys(user.id))[0].lastUsedAt).toEqual(new Date(5));
    expect(await store.revokeKey("someone-else", record.id)).toBe(false);
    expect(await store.revokeKey(user.id, record.id)).toBe(true);
    expect(await store.findActiveKey(hashSecret(full))).toBeNull();
    expect((await store.listKeys(user.id))[0].revokedAt).not.toBeNull();
  });

  it("caps active keys per user", async () => {
    const store = new MemoryAccountStore();
    const user = await store.upsertGithubUser({ githubId: "1", login: "u", name: null, avatarUrl: null });
    for (let i = 0; i < 10; i++) await store.createKey(user.id, `k${i}`);
    await expect(store.createKey(user.id, "one too many")).rejects.toThrow("10 active keys");
  });
});
