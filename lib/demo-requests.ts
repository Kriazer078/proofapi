import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { RateLimitError, ValidationError } from "./errors";

export interface DemoRequestInput {
  name: string;
  email: string;
  company?: string;
  message?: string;
  locale: string;
}

export interface DemoRequestRecord {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  locale: string;
  ipHash: string;
  createdAt: Date;
}

export interface DemoRequestStore {
  create(record: DemoRequestRecord): Promise<void>;
  countByIpSince(ipHash: string, since: Date): Promise<number>;
  list(limit: number): Promise<DemoRequestRecord[]>;
}

export const DEMO_LIMITS = { name: 100, email: 200, company: 150, message: 2000, perHour: 3 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LOCALES = new Set(["en", "ru", "kk"]);

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Clean and check the form fields. Throws ValidationError with a field-specific code. */
export function parseDemoRequest(body: Record<string, unknown>): DemoRequestInput {
  const name = text(body.name, DEMO_LIMITS.name);
  const email = text(body.email, DEMO_LIMITS.email).toLowerCase();
  if (!name) throw new ValidationError("Enter your name", "demo_name");
  if (!EMAIL.test(email)) throw new ValidationError("Enter a valid email address", "demo_email");
  const company = text(body.company, DEMO_LIMITS.company) || undefined;
  const message = text(body.message, DEMO_LIMITS.message) || undefined;
  const locale = typeof body.locale === "string" && LOCALES.has(body.locale) ? body.locale : "en";
  return { name, email, company, message, locale };
}

/** Store a request, at most a few per address per hour. */
export async function submitDemoRequest(
  store: DemoRequestStore,
  input: DemoRequestInput,
  ipHash: string,
  now = new Date(),
): Promise<DemoRequestRecord> {
  const since = new Date(now.getTime() - 60 * 60 * 1000);
  if ((await store.countByIpSince(ipHash, since)) >= DEMO_LIMITS.perHour)
    throw new RateLimitError("Too many requests from this address. Please try again in an hour.", "demo_rate_limited");
  const record: DemoRequestRecord = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    company: input.company ?? null,
    message: input.message ?? null,
    locale: input.locale,
    ipHash,
    createdAt: now,
  };
  await store.create(record);
  return record;
}

/** GitHub logins allowed to read demo requests, from ADMIN_GITHUB_LOGINS (comma-separated). */
export function isAdminLogin(login: string | null | undefined, env = process.env.ADMIN_GITHUB_LOGINS): boolean {
  if (!login || !env) return false;
  return env
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(login.toLowerCase());
}

export class MemoryDemoRequestStore implements DemoRequestStore {
  readonly rows: DemoRequestRecord[] = [];
  async create(record: DemoRequestRecord) {
    this.rows.push(record);
  }
  async countByIpSince(ipHash: string, since: Date) {
    return this.rows.filter((r) => r.ipHash === ipHash && r.createdAt >= since).length;
  }
  async list(limit: number) {
    return [...this.rows].sort((a, b) => +b.createdAt - +a.createdAt).slice(0, limit);
  }
}

export class PrismaDemoRequestStore implements DemoRequestStore {
  constructor(private readonly db: PrismaClient) {}
  async create(record: DemoRequestRecord) {
    await this.db.demoRequest.create({ data: record });
  }
  countByIpSince(ipHash: string, since: Date) {
    return this.db.demoRequest.count({ where: { ipHash, createdAt: { gte: since } } });
  }
  list(limit: number) {
    return this.db.demoRequest.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  }
}
