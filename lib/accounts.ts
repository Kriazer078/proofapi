import { randomBytes, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { hashSecret } from "./access";
import { ValidationError } from "./errors";

export interface UserRecord {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  last4: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface GithubProfile {
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

/** Each account may hold this many active keys; enough for prod, staging and a few services. */
export const MAX_ACTIVE_KEYS = 10;
const KEY_RE = /^pk_live_[0-9a-f]{48}$/;

/** A new key: the full value is returned once, the record keeps only its hash and last four characters. */
export function newApiKey(userId: string, name: string, now: Date): { full: string; record: ApiKeyRecord } {
  const full = `pk_live_${randomBytes(24).toString("hex")}`;
  const clean = name.trim().slice(0, 60) || "Untitled key";
  return {
    full,
    record: { id: randomUUID(), userId, name: clean, keyHash: hashSecret(full), last4: full.slice(-4), createdAt: now, lastUsedAt: null, revokedAt: null },
  };
}

/** The key in an `Authorization: Bearer pk_live_…` header, or null. */
export function keyFromHeader(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "");
  return m && KEY_RE.test(m[1]) ? m[1] : null;
}

export interface AccountStore {
  upsertGithubUser(p: GithubProfile): Promise<UserRecord>;
  getUser(id: string): Promise<UserRecord | null>;
  createKey(userId: string, name: string): Promise<{ full: string; record: ApiKeyRecord }>;
  listKeys(userId: string): Promise<ApiKeyRecord[]>;
  revokeKey(userId: string, keyId: string): Promise<boolean>;
  findActiveKey(keyHash: string): Promise<ApiKeyRecord | null>;
  touchKey(keyId: string, at: Date): Promise<void>;
}

function tooMany(): never {
  throw new ValidationError(`You already have ${MAX_ACTIVE_KEYS} active keys. Revoke one first.`, "too_many_keys");
}

export class MemoryAccountStore implements AccountStore {
  private users: UserRecord[] = [];
  private keys: ApiKeyRecord[] = [];

  async upsertGithubUser(p: GithubProfile): Promise<UserRecord> {
    const found = this.users.find((u) => u.githubId === p.githubId);
    if (found) {
      Object.assign(found, { login: p.login, name: p.name, avatarUrl: p.avatarUrl });
      return { ...found };
    }
    const user = { id: randomUUID(), ...p, createdAt: new Date() };
    this.users.push(user);
    return { ...user };
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const u = this.users.find((x) => x.id === id);
    return u ? { ...u } : null;
  }

  async createKey(userId: string, name: string) {
    if (this.keys.filter((k) => k.userId === userId && !k.revokedAt).length >= MAX_ACTIVE_KEYS) tooMany();
    const made = newApiKey(userId, name, new Date());
    this.keys.push(made.record);
    return { full: made.full, record: { ...made.record } };
  }

  async listKeys(userId: string): Promise<ApiKeyRecord[]> {
    return this.keys.filter((k) => k.userId === userId).map((k) => ({ ...k }));
  }

  async revokeKey(userId: string, keyId: string): Promise<boolean> {
    const k = this.keys.find((x) => x.id === keyId && x.userId === userId && !x.revokedAt);
    if (!k) return false;
    k.revokedAt = new Date();
    return true;
  }

  async findActiveKey(keyHash: string): Promise<ApiKeyRecord | null> {
    const k = this.keys.find((x) => x.keyHash === keyHash && !x.revokedAt);
    return k ? { ...k } : null;
  }

  async touchKey(keyId: string, at: Date): Promise<void> {
    const k = this.keys.find((x) => x.id === keyId);
    if (k) k.lastUsedAt = at;
  }
}

export class PrismaAccountStore implements AccountStore {
  constructor(private readonly db: PrismaClient) {}

  async upsertGithubUser(p: GithubProfile): Promise<UserRecord> {
    return this.db.user.upsert({
      where: { githubId: p.githubId },
      update: { login: p.login, name: p.name, avatarUrl: p.avatarUrl },
      create: { id: randomUUID(), ...p, createdAt: new Date() },
    });
  }

  getUser(id: string): Promise<UserRecord | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  async createKey(userId: string, name: string) {
    if ((await this.db.apiKey.count({ where: { userId, revokedAt: null } })) >= MAX_ACTIVE_KEYS) tooMany();
    const made = newApiKey(userId, name, new Date());
    await this.db.apiKey.create({ data: made.record });
    return made;
  }

  listKeys(userId: string): Promise<ApiKeyRecord[]> {
    return this.db.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async revokeKey(userId: string, keyId: string): Promise<boolean> {
    const res = await this.db.apiKey.updateMany({ where: { id: keyId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return res.count > 0;
  }

  findActiveKey(keyHash: string): Promise<ApiKeyRecord | null> {
    return this.db.apiKey.findFirst({ where: { keyHash, revokedAt: null } });
  }

  async touchKey(keyId: string, at: Date): Promise<void> {
    await this.db.apiKey.update({ where: { id: keyId }, data: { lastUsedAt: at } });
  }
}
