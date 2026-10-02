import { describe, expect, it, vi } from "vitest";
import { ProofAPI, ProofAPIError, sha256Hex } from "../packages/sdk/src/index";
const key = "pk_live_" + "a".repeat(48);
describe("SDK HTTP contract", () => {
  it("sends a seal with a Bearer key and preserves pending chain errors", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          id: "record",
          status: "PENDING_CHAIN",
          chainError: "RPC unavailable",
        }),
      );
    const sdk = new ProofAPI({ apiKey: key, fetch: fetcher });
    const input = {
      input: "ticket",
      output: "billing",
      model: "declared-model",
    };
    expect(await sdk.seal(input)).toMatchObject({
      status: "PENDING_CHAIN",
      chainError: "RPC unavailable",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://proofapi.vercel.app/api/v1/seal",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
        headers: expect.objectContaining({ Authorization: `Bearer ${key}` }),
        redirect: "error",
      }),
    );
  });
  it("supports hash-only, verification and evidence endpoints", async () => {
    const fetcher = vi
      .fn()
      .mockImplementation(async () => Response.json({ result: { status: "VERIFIED" } }));
    const sdk = new ProofAPI({
      baseURL: "http://127.0.0.1:3000",
      fetch: fetcher,
    });
    await sdk.sealHashes({
      input_hash: "a".repeat(64),
      output_hash: "b".repeat(64),
      metadata_hash: "c".repeat(64),
    });
    await sdk.verify("a/b");
    await sdk.evidence("id");
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      "http://127.0.0.1:3000/api/proofs/hashes",
      "http://127.0.0.1:3000/api/proofs/a%2Fb/verify",
      "http://127.0.0.1:3000/api/proofs/id/evidence",
    ]);
    expect(fetcher.mock.calls[1][1].body).toBeUndefined();
  });
  it("sends camelCase fingerprints in the documented wire format", async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json({ proof: {} }, { status: 201 }));
    const sdk = new ProofAPI({ baseURL: "http://127.0.0.1:3000", fetch: fetcher });
    await sdk.sealHashes({
      inputHash: "a".repeat(64),
      outputHash: "b".repeat(64),
      metadataHash: "c".repeat(64),
      agentId: "agent-1",
    });
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      input_hash: "a".repeat(64),
      output_hash: "b".repeat(64),
      metadata_hash: "c".repeat(64),
      agent_id: "agent-1",
    });
  });

  it("hashes text the same way as Node crypto", async () => {
    const { createHash } = await import("node:crypto");
    expect(await sha256Hex("Привет, ProofAPI")).toBe(
      createHash("sha256").update("Привет, ProofAPI").digest("hex"),
    );
  });

  it("returns typed auth/limit errors and never retries writes", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: "Limit reached", code: "monthly_limit" },
          { status: 429 },
        ),
      );
    const sdk = new ProofAPI({ fetch: fetcher });
    await expect(sdk.seal({ input: "a", output: "b" })).rejects.toMatchObject({
      name: "ProofAPIError",
      status: 429,
      code: "monthly_limit",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not accept credential-bearing or insecure remote origins", () => {
    expect(() => new ProofAPI({ baseURL: "http://example.com" })).toThrow();
    expect(
      () => new ProofAPI({ baseURL: "https://user:pass@example.com" }),
    ).toThrow();
    expect(() => new ProofAPI({ apiKey: "bad" })).toThrow();
  });
  it("handles invalid JSON and cancellation", async () => {
    const sdk = new ProofAPI({
      fetch: vi.fn().mockResolvedValue(new Response("not json")),
    });
    await expect(sdk.verify("id")).rejects.toBeInstanceOf(ProofAPIError);
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi.fn().mockImplementation((_url, options) => {
      options.signal.throwIfAborted();
    });
    await expect(
      new ProofAPI({ fetch: fetcher }).verify("id", {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
