import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Who created which proof, and from which (hashed) address. Raw IPs and owner tokens are never stored. */
export interface UploadRecord {
  proofId: string;
  ownerHash: string;
  ipHash: string;
  createdAt: Date;
}

export interface AccessStore {
  record(r: UploadRecord): Promise<void>;
  owns(proofId: string, ownerHash: string): Promise<boolean>;
  ownedIds(ownerHash: string): Promise<string[]>;
  countSince(since: Date, ipHash?: string): Promise<number>;
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
}

export class PrismaAccessStore implements AccessStore {
  constructor(private readonly db: PrismaClient) {}

  async record(r: UploadRecord): Promise<void> {
    await this.db.upload.create({ data: r });
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
