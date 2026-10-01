import { cookies, headers } from "next/headers";
import { type AccessStore, checkRateLimit, hashSecret, newOwnerToken } from "./access";
import { ForbiddenError, RateLimitError } from "./errors";

/** HttpOnly cookie holding a random token that marks the browser which created a certificate. */
export const OWNER_COOKIE = "pa_owner";
const TOKEN = /^[0-9a-f]{64}$/;

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

/** Checks the upload limits before a new certificate is created. */
export async function admitUpload(access: AccessStore): Promise<{ ownerHash: string; ipHash: string }> {
  const [ownerHash, ipHash] = [await ensureOwnerHash(), await clientIpHash()];
  if (!(await checkRateLimit(access, ipHash, new Date()))) throw new RateLimitError();
  return { ownerHash, ipHash };
}

/** Demo attacks (edit, restore, delete) are allowed only from the browser that created the certificate. */
export async function requireOwner(access: AccessStore, proofId: string): Promise<void> {
  const ownerHash = await currentOwnerHash();
  if (!ownerHash || !(await access.owns(proofId, ownerHash))) {
    throw new ForbiddenError("Only the browser that created this certificate can change it", "not_owner");
  }
}
