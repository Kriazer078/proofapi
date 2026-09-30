const enc = new TextEncoder();

async function sha256(parts: Uint8Array[]): Promise<Uint8Array> {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    buf.set(p, off);
    off += p.length;
  }
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
}

function u64(n: number): Uint8Array {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, BigInt(n), true);
  return b;
}

function nameBytes(s: string): number[] {
  const out = new Array(32).fill(0);
  enc.encode(s).forEach((b, i) => (out[i] = b));
  return out;
}

const bytes = (n: number, v: number) => new Array(n).fill(v);

describe("proof_registry", () => {
  const authority = new web3.Keypair();
  const [issuer] = web3.PublicKey.findProgramAddressSync([enc.encode("issuer"), authority.publicKey.toBuffer()], pg.PROGRAM_ID);
  const proofAt = (seq: number) =>
    web3.PublicKey.findProgramAddressSync([enc.encode("proof"), issuer.toBuffer(), u64(seq)], pg.PROGRAM_ID)[0];

  async function fund(to: web3.PublicKey, sol: number) {
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({ fromPubkey: pg.wallet.publicKey, toPubkey: to, lamports: sol * web3.LAMPORTS_PER_SOL }),
    );
    await web3.sendAndConfirmTransaction(pg.connection, tx, [pg.wallet.keypair]);
  }

  async function createProof(writer: web3.Keypair | null, seq: number, fill: number) {
    const signer = writer ?? pg.wallet.keypair;
    return pg.program.methods
      .createProof(bytes(16, fill), bytes(32, fill), bytes(32, fill + 1), bytes(32, fill + 2))
      .accounts({ issuer, proof: proofAt(seq), writer: signer.publicKey, systemProgram: web3.SystemProgram.programId })
      .signers(writer ? [writer] : [])
      .rpc();
  }

  it("registers an issuer", async () => {
    await fund(authority.publicKey, 0.05);
    await pg.program.methods
      .registerIssuer(nameBytes("Playground Test"), pg.wallet.publicKey)
      .accounts({ issuer, authority: authority.publicKey, systemProgram: web3.SystemProgram.programId })
      .signers([authority])
      .rpc();
    const acc = await pg.program.account.issuer.fetch(issuer);
    assert(acc.writer.equals(pg.wallet.publicKey));
    assert(acc.active);
    assert.equal(acc.proofCount.toNumber(), 0);
  });

  it("numbers proofs and links them into a hash chain", async () => {
    await createProof(null, 0, 1);
    await createProof(null, 1, 2);
    const first = await pg.program.account.proofRecord.fetch(proofAt(0));
    const second = await pg.program.account.proofRecord.fetch(proofAt(1));
    assert.equal(first.sequence.toNumber(), 0);
    assert.deepEqual(first.prevRecordHash, bytes(32, 0));
    assert.deepEqual(second.prevRecordHash, first.recordHash);
    const ts = new Uint8Array(8);
    new DataView(ts.buffer).setBigInt64(0, BigInt(first.timestamp.toNumber()), true);
    const expected = await sha256([
      enc.encode("proofapi-v1"),
      issuer.toBuffer(),
      u64(0),
      Uint8Array.from(bytes(16, 1)),
      Uint8Array.from(bytes(32, 1)),
      Uint8Array.from(bytes(32, 2)),
      Uint8Array.from(bytes(32, 3)),
      Uint8Array.from(bytes(32, 0)),
      ts,
    ]);
    assert.deepEqual(Array.from(expected), first.recordHash);
    const acc = await pg.program.account.issuer.fetch(issuer);
    assert.equal(acc.proofCount.toNumber(), 2);
  });

  it("rejects a stranger's signature", async () => {
    const stranger = new web3.Keypair();
    await fund(stranger.publicKey, 0.01);
    try {
      await createProof(stranger, 2, 9);
      assert.fail("stranger was able to write");
    } catch (e) {
      assert.match(String(e), /UnauthorizedWriter|6001/);
    }
  });

  it("refuses writes while the issuer is inactive", async () => {
    await pg.program.methods.setActive(false).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    try {
      await createProof(null, 2, 3);
      assert.fail("inactive issuer was able to write");
    } catch (e) {
      assert.match(String(e), /IssuerInactive|6000/);
    }
    await pg.program.methods.setActive(true).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    await createProof(null, 2, 3);
  });

  it("rotates the writer key", async () => {
    const next = new web3.Keypair();
    await fund(next.publicKey, 0.01);
    await pg.program.methods.setWriter(next.publicKey).accounts({ issuer, authority: authority.publicKey }).signers([authority]).rpc();
    try {
      await createProof(null, 3, 4);
      assert.fail("old writer was able to write");
    } catch (e) {
      assert.match(String(e), /UnauthorizedWriter|6001/);
    }
    await createProof(next, 3, 4);
  });
});
