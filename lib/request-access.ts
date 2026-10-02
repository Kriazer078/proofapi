import { cookies, headers } from "next/headers";
import { type AccessStore, checkRateLimit, checkUserLimit, hashSecret, newOwnerToken } from "./access";
import { type AccountStore, keyFromHeader } from "./accounts";
import { currentUser } from "./auth";
import { ForbiddenError, RateLimitError, UnauthorizedError } from "./errors";

/** HttpOnly cookie holding a random token that marks the browser which created a certificate. */
export const OWNER_COOKIE = "pa_owner";
const TOKEN = /^[0-9a-f]{64}$/;

/** Who is calling: an API key's owner, a signed-in console user, or an anonymous visitor (both null). */
export interface Caller {
  userId: string | null;
  apiKeyId: string | null;
}

/** Hash of this browser's owner token, or null when it has none. Safe in server components. */
export async function currentOwnerHash(): Promise<string | null> {
  const value = (await cookies()).get(OWNER_COOKIE)?.value;
  return value && TOKEN.test(value) ? hashSecret(value) : null;
}

/** Route handlers only: returns this browser's owner hash, issuing a token cookie on first use. */
export async function ensureOwnerHash(): Promise<string> {
  const jar = await cookies();
  let value = jar.get(OWNER_COOKIE)?.value;
  if (!value || !TOKEN.test(value)) {
    value = newOwnerToken();
    jar.set(OWNER_COOKIE, value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return hashSecret(value);
}

/** The caller's IP, hashed with a server-side salt so the raw address is never stored. */
export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  return hashSecret(`ip:${process.env.IP_HASH_SALT ?? ""}:${ip}`);
}

/**
 * An `Authorization: Bearer pk_live_…` header wins; a key that is present but unknown or revoked is
 * an error rather than a silent fall back to anonymous limits. Otherwise the console session counts.
 */
export async function resolveCaller(accounts: AccountStore): Promise<Caller> {
  const authorization = (await headers()).get("authorization");
  const key = keyFromHeader(authorization);
  if (authorization !== null && !key) throw new UnauthorizedError();
  if (key) {
    const record = await accounts.findActiveKey(hashSecret(key));
    if (!record) throw new UnauthorizedError();
    await accounts.touchKey(record.id, new Date());
    return { userId: record.userId, apiKeyId: record.id };
  }
  const user = await currentUser();
  return { userId: user?.id ?? null, apiKeyId: null };
}

/** Checks limits before a new certificate is created: the monthly allowance for accounts, per-address limits otherwise. */
export async function admitUpload(access: AccessStore, caller: Caller): Promise<{ ownerHash: string; ipHash: string; userId: string | null; apiKeyId: string | null }> {
  const [ownerHash, ipHash] = [await ensureOwnerHash(), await clientIpHash()];
  const now = new Date();
  if (caller.userId) {
    if (!(await checkUserLimit(access, caller.userId, now))) {
      throw new RateLimitError("This account has used its monthly allowance. It renews on the 1st.", "monthly_limit");
    }
  } else if (!(await checkRateLimit(access, ipHash, now))) {
    throw new RateLimitError();
  }
  return { ownerHash, ipHash, userId: caller.userId, apiKeyId: caller.apiKeyId };
}

/** True when this browser created the certificate or the signed-in account owns it. */
export async function isOwner(access: AccessStore, proofId: string): Promise<boolean> {
  const ownerHash = await currentOwnerHash();
  if (ownerHash && (await access.owns(proofId, ownerHash))) return true;
  const user = await currentUser();
  return user ? access.ownedByUser(proofId, user.id) : false;
}

/** Demo attacks (edit, restore, delete) are allowed only for the certificate's creator. */
export async function requireOwner(access: AccessStore, proofId: string): Promise<void> {
  if (!(await isOwner(access, proofId))) {
    throw new ForbiddenError("Only the browser that created this certificate can change it", "not_owner");
  }
}
