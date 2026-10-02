# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: teams building AI agents and AI services** for regulated clients (insurance claims, fintech credit and KYC decisions, legal reviews). Their clients, auditors and regulators ask "what exactly did your AI see and decide?", and their own logs are not evidence because they wrote them.
- **Also: lawyers and consultants** who send AI contract reviews to clients and need the client to trust the result was not changed later.
- **Recipients of certificates**: clients, auditors, courts. They have never used a blockchain and only open a link.
- **Hackathon judges** (Solana, Colosseum) evaluating the project.

## Product Purpose

ProofAPI seals an AI result at the moment it is produced: SHA-256 fingerprints of the input, the output and the metadata are recorded by our own Solana program in a numbered, hash-linked history. Anyone with the certificate link sees "Genuine" or "Changed" without an account, a wallet or trust in the operator. Success: a team integrates sealing in under an hour and a recipient understands the verdict in seconds.

## Positioning

Proof that does not require trusting the operator. Unlike server logs, WORM storage or single timestamps, the issuer's whole history is numbered and chained by a public program, so edits and deletions show up, and an independent verifier checks evidence against Solana without ProofAPI's servers.

## Operating Context

- Developers: REST API (`POST /api/proofs`, `/api/proofs/hashes`, verify, evidence), hash-only mode keeps documents on the client's side; a developer console with sign-in, API keys, playground, usage and certificates (in progress).
- Recipients: open `/proof/{id}` on a phone or desktop; can download an evidence file and use the standalone `verifier.html`.
- AI review: Google Gemini (`gemini-3.5-flash-lite`) when configured, deterministic mock otherwise.
- Hosting: Vercel (fra1), Neon Postgres, Solana devnet.

## Capabilities and Constraints

- Live: certificates, history journal, tamper detection, demo attacks limited to the creator's browser, upload rate limits, EN/RU/KK interface.
- Solana devnet only during the beta; mainnet after a security review.
- A certificate proves the data did not change since sealing. It does not prove the AI answer is correct; the model name is declared by the issuer.
- Pricing (confirmed): beta is free for everyone. Planned plans: Start $0 (100 seals/month), Team $49/month (10,000 seals), Company by request.
- Open: API key billing, issuer name per account, legal standing of certificates.

## Brand Commitments

- Name: ProofAPI. Logo: two linked blocks (a record and the one before it) — keep.
- Core metaphor: a digital seal / notary stamp. Plain words for recipients ("seal", "certificate", "Genuine", "Changed"); blockchain terms only in "details for specialists" and developer docs.
- Honesty about limits is part of the brand: say what a seal does not prove.
- Interface languages: English, Russian, Kazakh.

## Evidence on Hand

- Deployed Solana program `5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU` (devnet), live app https://proofapi.vercel.app, open source https://github.com/Kriazer078/proofapi.
- Market facts with sources (docs/research/2026-09-30-target-audience-research.md): Grant Thornton 2026, 78% of 950 executives not confident to pass an independent AI governance audit within 90 days; Gravitee 2026, 7.2% of 750 CIOs/CTOs have a named owner for AI agent behaviour; NAIC model bulletin on AI adopted by about 24 US states.
- No customers, logos, testimonials, case studies or usage metrics exist. Never fabricate them; example data must be labelled as examples.

## Product Principles

1. The recipient understands the verdict without knowing what a blockchain is.
2. Never ask anyone to trust us: every claim is checkable, including without our servers.
3. Say what we prove and what we do not.
4. Integration is one request; documents can stay with the client.
5. Real evidence only; examples are labelled.

## Accessibility & Inclusion

Three interface languages (EN/RU/KK). Verdicts must not rely on colour alone (word + seal). Recipients are often non-technical and on phones.
