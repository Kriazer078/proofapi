import { describe, expect, it } from "vitest";
import { upsertEnv } from "@/scripts/lib/env-file";

describe("upsertEnv", () => {
  it("replaces existing keys and appends new ones", () => {
    const text = 'CHAIN_MODE=memory\nPROGRAM_ID=\n# comment\n';
    expect(upsertEnv(text, { PROGRAM_ID: "abc", AUTHORITY_PUBKEY: "def" })).toBe(
      'CHAIN_MODE=memory\nPROGRAM_ID=abc\n# comment\nAUTHORITY_PUBKEY=def\n',
    );
  });

  it("fills defaults only when a key is missing or empty", () => {
    const text = "SOLANA_RPC_URL=https://my.rpc\nSOLANA_CLUSTER=\n";
    expect(upsertEnv(text, {}, { SOLANA_RPC_URL: "https://api.devnet.solana.com", SOLANA_CLUSTER: "devnet" })).toBe(
      "SOLANA_RPC_URL=https://my.rpc\nSOLANA_CLUSTER=devnet\n",
    );
  });

  it("does not touch commented-out keys", () => {
    expect(upsertEnv("# PROGRAM_ID=old\n", { PROGRAM_ID: "new" })).toBe("# PROGRAM_ID=old\nPROGRAM_ID=new\n");
  });
});
