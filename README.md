# ProofAPI — Tamper-Evident Receipts for AI Answers

[![CI](https://github.com/Kriazer078/proofapi/actions/workflows/ci.yml/badge.svg)](https://github.com/Kriazer078/proofapi/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://explorer.solana.com/address/5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU?cluster=devnet)
[![Hackathon](https://img.shields.io/badge/Colosseum-2026-14F195)](https://colosseum.org)

ProofAPI puts a digital seal on an AI result. The input, the AI output and the settings are fingerprinted, and the fingerprints are recorded by our own Solana program in a numbered, hash-linked history. Anyone with the link can check that nothing was changed, with no account and no crypto wallet.

![ProofAPI home page](assets/home.png)

---

## Submission to 2026 Solana National Hackathon

| Name | Role | Contact |
|------|------|---------|
| [Name] | [Role] | [Contact] |

---

## Problem and Solution

### 1. AI answers can be edited after the fact

A consultant sends a client an AI contract review. Later the risk score in that review is lowered, and nobody can prove what the AI actually said.

**Solution:** at the moment of the AI call, ProofAPI records SHA-256 fingerprints of the input, the output and the metadata on Solana. Changing one character later makes the certificate turn red.

### 2. Logs don't convince outsiders

Server logs and hash chains kept by the company can be rewritten by the same company.

**Solution:** the history lives in a public Solana program. Its rules (sequence numbers, hash links, the issuer's signing key) are enforced on-chain, and the time comes from the Solana clock.

### 3. Inconvenient records can be deleted quietly

If a record is removed from the operator's database, a normal log simply has a gap nobody notices.

**Solution:** every record is numbered and linked to the previous one. The history audit walks the chain on Solana and flags any record that is missing from, or different in, the database.

### 4. Documents are private

Clients' contracts can't be published on a blockchain.

**Solution:** only salted fingerprints go on-chain. The document stays with its owner, and a per-proof 32-byte salt prevents guessing short outputs.

| Genuine | After someone edits the AI answer |
|---|---|
| ![Genuine certificate](assets/certificate-genuine.png) | ![Changed certificate](assets/certificate-changed.png) |

**What a certificate does not prove:** that the AI answer is correct, or which model really ran (the model is declared by the issuer). It proves the recorded data hasn't changed since it was sealed.

---

## Why Solana

- **Rules enforced by a program, not by us.** Sequence numbers, the hash chain and the issuer's writer key are checked on-chain, so the operator can't rewrite its own history.
- **Cheap, fast records.** One record is a 233-byte account; rent is about 0.0025 SOL and confirmation takes seconds.
- **Trusted time.** Timestamps come from the Solana `Clock`, so records can't be back-dated.
- **Anyone can verify.** Verification reads public accounts from any RPC endpoint, without our servers.

---

## Summary of Features

- Upload a PDF or TXT, get an AI contract review and a sealed certificate link
- Plain-language certificate page: **Genuine** or **Changed**, with four simple checks
- Hash-only mode: send fingerprints through the API, keep the data at home
- History audit that finds deleted, edited and unlinked records
- Evidence pack (JSON) and a standalone [`verifier.html`](public/verifier.html) that checks it against Solana directly
- Demo controls for presentations (edit, restore, delete), allowed only for the browser that created the certificate
- English, Russian and Kazakh interface
- Upload limits per address and per day to protect the server wallet

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| On-chain program | Rust, Anchor (built and deployed with Solana Playground) |
| Chain client | TypeScript, `@solana/web3.js` v1, hand-written Anchor encoding |
| Web app and API | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| Database | Prisma 6, SQLite locally, Postgres (Neon) when hosted |
| Independent verifier | Single HTML file, WebCrypto, Solana JSON-RPC |
| Testing | Vitest (111 tests), byte-level fake of the program, devnet end-to-end script |
| AI | Deterministic mock for the demo; real providers plug in behind one interface |

---

## Architecture

```
 Browser / API client
        │  upload document (or send hashes only)
        ▼
 ┌─────────────────────────── Next.js app ───────────────────────────┐
 │ extract text → AI review → canonical JSON → salted SHA-256 x3     │
 │ (input, output, metadata)                                         │
 │                                                                   │
 │ Postgres: document, AI output, salt          ProofService         │
 └───────────────────────────────────┬───────────────────────────────┘
                                     │ create_proof(proof_id, 3 hashes)
                                     ▼
 ┌──────────────── Solana program proof_registry ────────────────────┐
 │ Issuer PDA   ["issuer", authority]   writer key, active, count,   │
 │                                      last_record_hash             │
 │ ProofRecord  ["proof", issuer, seq]  hashes, prev_record_hash,    │
 │                                      record_hash, timestamp       │
 │ record_hash = SHA256("proofapi-v1" ‖ fields ‖ prev ‖ timestamp)   │
 └───────────────────────────────────┬───────────────────────────────┘
                                     │ getAccountInfo (any RPC)
                                     ▼
       Certificate page  ·  History audit  ·  verifier.html (offline)
```

**Program:** [`programs/proof_registry/src/lib.rs`](programs/proof_registry/src/lib.rs) — instructions `register_issuer`, `set_writer`, `set_active`, `create_proof`. There is no instruction to edit or delete a record.

**Devnet deployment:** program [`5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU`](https://explorer.solana.com/address/5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU?cluster=devnet). Details in [`programs/proof_registry/README.md`](programs/proof_registry/README.md).

---

## Quick Start

**Prerequisites:** Node.js 20+. No Rust toolchain is needed: the program is built in [Solana Playground](https://beta.solpg.io).

```bash
git clone https://github.com/Kriazer078/proofapi
cd proofapi
npm install
cp .env.example .env
npm run db:push
npm test
npm run dev
```

Open http://localhost:3000. By default `CHAIN_MODE=memory` runs a local simulation of the program.

**On Solana devnet:**

```bash
npm run setup            # creates server keys in .keys/ (git-ignored)
# fund the printed writer address at https://faucet.solana.com
# set PROGRAM_ID and CHAIN_MODE=anchor in .env (or deploy your own copy, see programs/proof_registry/README.md)
npm run register-issuer
npm run chain:status
npm run e2e:devnet       # create, verify, tamper, audit, and write an evidence pack
```

---

## Roadmap

- **Now (MVP):** own Solana program, certificates, history audit, independent verifier, three languages
- **Next:** real AI providers with prompt caching; TypeScript and Python SDK with client-side hashing
- **Then:** batching many proofs into one account (Merkle root) to cut cost; zkTLS proof that an output came from the AI provider's API
- **Later:** qualified eIDAS timestamps on top of the record hash; mainnet deployment after a security review

---

## Resources

- Live app: _coming soon_
- Demo video: _coming soon_
- Presentation: _coming soon_
- Program on Solana Explorer: [devnet](https://explorer.solana.com/address/5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU?cluster=devnet)
- Design spec: [`docs/superpowers/specs/2026-09-30-proofapi-mvp-design.md`](docs/superpowers/specs/2026-09-30-proofapi-mvp-design.md)

---

## License

MIT — see [LICENSE](LICENSE)
