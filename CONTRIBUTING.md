# Contributing

1. Fork the repository and create a branch from `main`.
2. `npm install`, `cp .env.example .env`, `npm run db:push`.
3. Write a failing test first (`tests/`), then the code. Keep `npm test`, `npm run typecheck` and `npm run build` green.
4. Never commit keys: `.keys/`, `.env` and evidence packs are git-ignored. Hosted deployments read the writer key from the `WRITER_SECRET_KEY` environment variable.
5. Changes to the on-chain record layout must update both `programs/proof_registry/src/lib.rs` and `lib/solana/encoding.ts`, with tests in `tests/encoding.test.ts`.
6. Open a pull request describing what changed and how you tested it.
