#!/usr/bin/env node
/**
 * ProofAPI MCP server (stdio). Lets an AI agent seal its answers and check records without writing code.
 * Configure with PROOFAPI_API_KEY (optional; anonymous demo limits apply without it) and PROOFAPI_BASE_URL.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ProofAPI, ProofAPIError } from "./index.js";

const api = new ProofAPI({
  apiKey: process.env.PROOFAPI_API_KEY || undefined,
  baseURL: process.env.PROOFAPI_BASE_URL || undefined,
});

const server = new McpServer({ name: "proofapi", version: "0.2.0" });

const hex64 = z.string().regex(/^[0-9a-f]{64}$/, "64 lowercase hex characters");

function reply(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

async function run(call: () => Promise<unknown>) {
  try {
    return reply(await call());
  } catch (error) {
    const message =
      error instanceof ProofAPIError
        ? `${error.message} (HTTP ${error.status}${error.code ? `, ${error.code}` : ""})`
        : error instanceof Error
          ? error.message
          : String(error);
    return { isError: true, content: [{ type: "text" as const, text: message }] };
  }
}

server.registerTool(
  "seal_answer",
  {
    title: "Seal an AI answer",
    description:
      "Record the input and the AI answer on Solana and get a public certificate link. Anyone with the link can check the answer was not changed later. Each call creates a new record; do not retry a successful call.",
    inputSchema: {
      input: z.string().min(1).describe("The prompt, request or document the answer is based on"),
      output: z.string().min(1).describe("The AI answer or decision to seal"),
      model: z.string().optional().describe("Model name, as declared by you"),
      label: z.string().optional().describe("Short label, for example the agent or workflow name"),
    },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
  },
  (args) => run(() => api.seal(args)),
);

server.registerTool(
  "seal_hashes",
  {
    title: "Seal fingerprints only",
    description:
      "Record SHA-256 fingerprints of private data on Solana without sending the data itself. Keep the original bytes to prove the match later.",
    inputSchema: {
      inputHash: hex64.describe("SHA-256 of the input"),
      outputHash: hex64.describe("SHA-256 of the AI output"),
      metadataHash: hex64.describe("SHA-256 of the metadata, such as model and settings"),
      agentId: z.string().optional(),
      toolName: z.string().optional(),
    },
    annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: true },
  },
  (args) => run(() => api.sealHashes(args)),
);

server.registerTool(
  "verify_record",
  {
    title: "Verify a record",
    description:
      "Check a sealed record against Solana. Returns VERIFIED, FAILED (data changed or missing) or NOT_ON_CHAIN.",
    inputSchema: { id: z.string().min(1).describe("Record id returned when sealing") },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ id }) => run(() => api.verify(id)),
);

server.registerTool(
  "get_evidence",
  {
    title: "Get the evidence pack",
    description:
      "Download the evidence pack for a record: fingerprints, salt and Solana account, enough to verify it without ProofAPI.",
    inputSchema: { id: z.string().min(1).describe("Record id returned when sealing") },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ id }) => run(() => api.evidence(id)),
);

await server.connect(new StdioServerTransport());
