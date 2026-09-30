# proof_registry — build, test, deploy (Solana Playground)

No local Rust is needed. Everything happens at https://beta.solpg.io.

1. Fund the Playground wallet: open Playground, click the wallet in the bottom-left to create it, copy its address, and request devnet SOL at https://faucet.solana.com (sign in with GitHub for 5 SOL). Deploying needs about 2 SOL.
2. Create a project: **Create a new project → Anchor (Rust)**, name `proof_registry`.
3. Replace `src/lib.rs` with this folder's `src/lib.rs`. Replace the test file under `tests/` with `tests/proof_registry.test.ts`.
4. Click **Build**. Playground writes the program id into `declare_id!`.
5. Click **Deploy** (cluster: devnet). Wait for "Deployment successful".
6. Click **Test**. All five tests must pass.
7. Copy the program id (Build & Deploy tab → Program ID) into the project `.env`:
   ```bash
   PROGRAM_ID=<program id>
   ```
8. Copy the program id into `declare_id!` in this repo's `src/lib.rs` too, and commit, so the source matches the deployment.

## Devnet deployment

| | |
|---|---|
| Program ID | [`5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU`](https://explorer.solana.com/address/5ffvduJkfxLgFiJEoZ9Pjq7oPVW1aKCgfqzmEto1FqjU?cluster=devnet) |
| Issuer "ProofAPI Demo" | [`6BRxYyhiCaBpHgZqWvrH6ejxXcVXqWR7vs9SrJ9ite7E`](https://explorer.solana.com/address/6BRxYyhiCaBpHgZqWvrH6ejxXcVXqWR7vs9SrJ9ite7E?cluster=devnet) |
| Issuer registration | [transaction](https://explorer.solana.com/tx/4poNRz2DiPiGMXk8G4sGjNt1c8yGC7PHaLtSb57oLH3ctrkDr3CXJ5wXQwmkN4A2syGvDScGb6MnoPaiUcqWXrZi?cluster=devnet) |
| First proof (#0) | [transaction](https://explorer.solana.com/tx/3qeFpH72zMeicoGe3Lzk6DX9wGmyeyBaajNXWKqSh9XrmbLb1vX9PL26FoyNCeQkrsvjj6yqh9cZ3K94rciJ2tk2?cluster=devnet) |

Deployed 2026-09-30 from Solana Playground. `npm run e2e:devnet` passed all five steps, and `public/verifier.html` verified `evidence-0.json` directly against devnet.
