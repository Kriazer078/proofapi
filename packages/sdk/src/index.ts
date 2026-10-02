export type ProofStatus = "PENDING_CHAIN" | "ANCHORED";
export interface SealInput {
  input: string;
  output: string;
  model?: string;
  label?: string;
}
export interface SealResult {
  id: string;
  status: ProofStatus;
  sequence: number | null;
  certificateUrl: string;
  recordHash: string | null;
  inputHash: string;
  outputHash: string;
  chainError: string | null;
}
/** SHA-256 fingerprints (64 hex characters) computed on your side. The data itself is never sent. */
export interface HashInput {
  inputHash: string;
  outputHash: string;
  metadataHash: string;
  agentId?: string;
  toolName?: string;
}
/** The field names used by 0.1.0; still accepted. */
export interface LegacyHashInput {
  input_hash: string;
  output_hash: string;
  metadata_hash: string;
  agent_id?: string;
  tool_name?: string;
}
export interface HashResult {
  proof: {
    id: string;
    status: ProofStatus;
    sequence: number | null;
    recordHash: string | null;
    [key: string]: unknown;
  };
  chainError: string | null;
}
export interface VerificationResult {
  result: {
    status: "VERIFIED" | "FAILED" | "NOT_ON_CHAIN";
    checks: Record<string, unknown>;
    [key: string]: unknown;
  };
}
export interface EvidencePack {
  version: "proofapi-evidence-v1";
  [key: string]: unknown;
}
export interface ProofAPIOptions {
  apiKey?: string;
  baseURL?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
}
/** SHA-256 of a UTF-8 string as lowercase hex, for use with sealHashes(). */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export class ProofAPIError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ProofAPIError";
  }
}
/** Server-side client. No automatic write retries: a repeated write can create another record. */
export class ProofAPI {
  private readonly baseURL: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof globalThis.fetch;
  constructor(options: ProofAPIOptions = {}) {
    const base = new URL(options.baseURL ?? "https://proofapi.vercel.app");
    if (
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== "/"
    )
      throw new Error(
        "baseURL must be an origin without a path or credentials",
      );
    if (
      base.protocol !== "https:" &&
      !(
        base.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)
      )
    )
      throw new Error("Use HTTPS, or HTTP on localhost for development");
    if (
      options.apiKey !== undefined &&
      !/^pk_live_[0-9a-f]{48}$/.test(options.apiKey)
    )
      throw new Error("Invalid ProofAPI key format");
    this.timeoutMs = options.timeoutMs ?? 65000;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0)
      throw new Error("timeoutMs must be positive");
    this.baseURL = base.origin;
    this.apiKey = options.apiKey;
    this.fetcher = options.fetch ?? globalThis.fetch;
  }
  seal(
    input: SealInput,
    options?: { signal?: AbortSignal },
  ): Promise<SealResult> {
    return this.request("/api/v1/seal", "POST", input, options?.signal);
  }
  sealHashes(
    input: HashInput | LegacyHashInput,
    options?: { signal?: AbortSignal },
  ): Promise<HashResult> {
    const body =
      "inputHash" in input
        ? {
            input_hash: input.inputHash,
            output_hash: input.outputHash,
            metadata_hash: input.metadataHash,
            agent_id: input.agentId,
            tool_name: input.toolName,
          }
        : input;
    return this.request("/api/proofs/hashes", "POST", body, options?.signal);
  }
  verify(
    id: string,
    options?: { signal?: AbortSignal },
  ): Promise<VerificationResult> {
    return this.request(
      `/api/proofs/${encodeURIComponent(id)}/verify`,
      "GET",
      undefined,
      options?.signal,
    );
  }
  evidence(
    id: string,
    options?: { signal?: AbortSignal },
  ): Promise<EvidencePack> {
    return this.request(
      `/api/proofs/${encodeURIComponent(id)}/evidence`,
      "GET",
      undefined,
      options?.signal,
    );
  }
  private async request<T>(
    path: string,
    method: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const deadline = AbortSignal.timeout(this.timeoutMs);
    const response = await this.fetcher(`${this.baseURL}${path}`, {
      method,
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = data as { error?: unknown; code?: unknown } | null;
      throw new ProofAPIError(
        typeof error?.error === "string"
          ? error.error
          : `ProofAPI request failed (${response.status})`,
        response.status,
        typeof error?.code === "string" ? error.code : undefined,
      );
    }
    if (!data || typeof data !== "object")
      throw new ProofAPIError(
        "Expected a JSON response from ProofAPI",
        response.status,
        "invalid_response",
      );
    return data as T;
  }
}
export default ProofAPI;
