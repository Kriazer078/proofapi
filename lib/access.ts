import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Who created which proof, and from which (hashed) address. Raw IPs and owner tokens are never stored. */
export interface UploadRecord {
  proofId: string;
  ownerHash: string;
  ipHash: string;
  /** Signed-in account or API key owner, when the upload was authenticated. */
  userId?: string | null;
  apiKeyId?: string | null;
  createdAt: Date;
}

export interface AccessStore {
  record(r: UploadRecord): Promise<void>;
  owns(proofId: string, ownerHash: string): Promise<boolean>;
  ownedIds(ownerHash: string): Promise<string[]>;
  countSince(since: Date, ipHash?: string): Promise<number>;
  countUserSince(userId: string, since: Date): Promise<number>;
  userUploads(userId: string, since: Date, limit: number): Promise<UploadRecord[]>;
  ownedByUser(proofId: string, userId: string): Promise<boolean>;
}

export interface RateLimits {
  perIpPerHour: number;
  perDay: number;
}

export const DEFAULT_LIMITS: RateLimits = {
  perIpPerHour: Number(process.env.RATE_LIMIT_PER_HOUR ?? 10),
  perDay: Number(process.env.RATE_LIMIT_PER_DAY ?? 200),
};

export function newOwnerToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(`proofapi-access:${value}`).digest("hex");
}

/** Each new proof costs SOL from the server wallet, so uploads are limited per address and per day. */
export async function checkRateLimit(store: AccessStore, ipHash: string, now: Date, limits: RateLimits = DEFAULT_LIMITS): Promise<boolean> {
  const hourAgo = new Date(now.getTime() - 3600_000);
  const dayAgo = new Date(now.getTime() - 24 * 3600_000);
  if ((await store.countSince(hourAgo, ipHash)) >= limits.perIpPerHour) return false;
  return (await store.countSince(dayAgo)) < limits.perDay;
}

/** Monthly allowance for signed-in accounts and API keys, counted from the first day of the UTC month. */
export const MONTHLY_LIMIT = Number(process.env.BETA_MONTHLY_LIMIT ?? 1000);

export function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function checkUserLimit(store: AccessStore, userId: string, now: Date, limit = MONTHLY_LIMIT): Promise<boolean> {
  return (await store.countUserSince(userId, monthStart(now))) < limit;
}

export class MemoryAccessStore implements AccessStore {
  private readonly rows: UploadRecord[] = [];

  async record(r: UploadRecord): Promise<void> {
    this.rows.push({ ...r });
  }

  async owns(proofId: string, ownerHash: string): Promise<boolean> {
    return this.rows.some((r) => r.proofId === proofId && r.ownerHash === ownerHash);
  }

  async ownedIds(ownerHash: string): Promise<string[]> {
    return this.rows.filter((r) => r.ownerHash === ownerHash).map((r) => r.proofId);
  }

  async countSince(since: Date, ipHash?: string): Promise<number> {
    return this.rows.filter((r) => r.createdAt > since && (ipHash === undefined || r.ipHash === ipHash)).length;
  }

  async countUserSince(userId: string, since: Date): Promise<number> {
    return this.rows.filter((r) => r.userId === userId && r.createdAt >= since).length;
  }

  async userUploads(userId: string, since: Date, limit: number): Promise<UploadRecord[]> {
    return this.rows
      .filter((r) => r.userId === userId && r.createdAt >= since)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((r) => ({ ...r }));
  }

  async ownedByUser(proofId: string, userId: string): Promise<boolean> {
    return this.rows.some((r) => r.proofId === proofId && r.userId === userId);
  }
}

export class PrismaAccessStore implements AccessStore {
  constructor(private readonly db: PrismaClient) {}

  async record(r: UploadRecord): Promise<void> {
    await this.db.upload.create({ data: { ...r, userId: r.userId ?? null, apiKeyId: r.apiKeyId ?? null } });
  }

  countUserSince(userId: string, since: Date): Promise<number> {
    return this.db.upload.count({ where: { userId, createdAt: { gte: since } } });
  }

  userUploads(userId: string, since: Date, limit: number): Promise<UploadRecord[]> {
    return this.db.upload.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: limit });
  }

  async ownedByUser(proofId: string, userId: string): Promise<boolean> {
    return (await this.db.upload.count({ where: { proofId, userId } })) > 0;
  }

  async owns(proofId: string, ownerHash: string): Promise<boolean> {
    return (await this.db.upload.count({ where: { proofId, ownerHash } })) > 0;
  }

  async ownedIds(ownerHash: string): Promise<string[]> {
    const rows = await this.db.upload.findMany({ where: { ownerHash }, select: { proofId: true } });
    return rows.map((r) => r.proofId);
  }

  async countSince(since: Date, ipHash?: string): Promise<number> {
    return this.db.upload.count({ where: { createdAt: { gt: since }, ...(ipHash ? { ipHash } : {}) } });
  }
}
