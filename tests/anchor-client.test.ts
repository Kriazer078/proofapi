import { Keypair } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { ChainError } from "@/lib/errors";
import { AnchorChainClient } from "@/lib/solana/anchor-client";
import { issuerPda, setActiveIx, setWriterIx } from "@/lib/solana/encoding";
import { ZERO_HASH, computeRecordHash } from "@/lib/solana/record-hash";
import { FakeProgramRpc, fakeDevnet, proofAccountBytes } from "./helpers/fake-program";

const input = (n: number) => ({
  proofId: `123e4567-e89b-42d3-a456-42661417400${n}`,
  inputHash: "aa".repeat(32),
  outputHash: "bb".repeat(32),
  metadataHash: "cc".repeat(32),
});

async function setup() {
  const net = await fakeDevnet();
  const client = new AnchorChainClient({
    rpc: net.rpc,
    programId: net.programId,
    authority: net.authority.publicKey,
    writer: net.writer,
    cluster: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
  });
  return { ...net, client };
}

describe("AnchorChainClient", () => {
  it("reports a clear error when the issuer is not registered", async () => {
    const programId = Keypair.generate().publicKey;
    const client = new AnchorChainClient({
      rpc: new FakeProgramRpc(programId),
      programId,
      authority: Keypair.generate().publicKey,
      writer: Keypair.generate(),
      cluster: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
    });
    expect(await client.readIssuer()).toBeNull();
    await expect(client.ensureIssuer()).rejects.toThrow("npm run register-issuer");
  });

  it("reads the registered issuer at its PDA", async () => {
    const { client, programId, authority, writer } = await setup();
    expect(client.issuerAddress()).toBe(issuerPda(programId, authority.publicKey).toBase58());
    expect(await client.ensureIssuer()).toMatchObject({
      name: "ProofAPI Demo",
      writer: writer.publicKey.toBase58(),
      active: true,
      proofCount: 0,
      lastRecordHash: ZERO_HASH,
    });
  });

  it("numbers records and links them into a hash chain", async () => {
    const { client } = await setup();
    const first = await client.anchorProof(input(1));
    const second = await client.anchorProof(input(2));
    expect(first).toMatchObject({ sequence: 0, prevRecordHash: ZERO_HASH, signature: "fake-sig-1" });
    expect(second).toMatchObject({ sequence: 1, prevRecordHash: first.recordHash });
    const record = await client.readProofAccount(second.account);
    expect(record).toEqual(await client.readProofBySequence(1));
    expect(computeRecordHash(record!)).toBe(second.recordHash);
    expect(await client.readIssuer()).toMatchObject({ proofCount: 2, lastRecordHash: second.recordHash });
  });

  it("serialises concurrent writes so each gets its own sequence", async () => {
    const { client } = await setup();
    const results = await Promise.all([client.anchorProof(input(1)), client.anchorProof(input(2)), client.anchorProof(input(3))]);
    expect(results.map((r) => r.sequence).sort()).toEqual([0, 1, 2]);
  });

  it("refuses to write when the issuer is inactive or the writer key was rotated", async () => {
    const { client, rpc, programId, authority } = await setup();
    await rpc.send(setActiveIx(programId, authority.publicKey, false), [authority]);
    await expect(client.anchorProof(input(1))).rejects.toBeInstanceOf(ChainError);
    await rpc.send(setActiveIx(programId, authority.publicKey, true), [authority]);
    await expect(client.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
    await rpc.send(setWriterIx(programId, authority.publicKey, Keypair.generate().publicKey), [authority]);
    await expect(client.anchorProof(input(2))).rejects.toThrow("is not the issuer's writer");
  });

  it("passes network failures through", async () => {
    const { client, rpc } = await setup();
    rpc.failNextSend = new Error("RPC down");
    await expect(client.anchorProof(input(1))).rejects.toThrow("RPC down");
    await expect(client.anchorProof(input(1))).resolves.toMatchObject({ sequence: 0 });
  });

  it("ignores accounts that are not our ProofRecords", async () => {
    const { client, rpc } = await setup();
    const r = await client.anchorProof(input(1));
    const foreign = Keypair.generate().publicKey;
    const bytes = proofAccountBytes({ ...(await client.readProofAccount(r.account))! });
    rpc.plant(foreign, bytes, Keypair.generate().publicKey);
    expect(await client.readProofAccount(foreign.toBase58())).toBeNull();
    const garbage = Keypair.generate().publicKey;
    rpc.plant(garbage, Buffer.alloc(233));
    expect(await client.readProofAccount(garbage.toBase58())).toBeNull();
    expect(await client.readProofAccount("not-a-key")).toBeNull();
    expect(await client.readProofBySequence(5)).toBeNull();
  });

  it("builds explorer links and evidence context", async () => {
    const { client, programId } = await setup();
    expect(client.mode).toBe("anchor");
    expect(client.explorerUrl("abc")).toBe("https://explorer.solana.com/tx/abc?cluster=devnet");
    expect(client.accountUrl("xyz")).toBe("https://explorer.solana.com/address/xyz?cluster=devnet");
    expect(client.evidenceContext()).toEqual({
      cluster: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
      programId: programId.toBase58(),
    });
  });
});
