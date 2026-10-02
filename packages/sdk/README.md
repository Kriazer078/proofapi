# proofapi

TypeScript / ESM client and MCP server for [ProofAPI](https://proofapi.vercel.app) on Node.js 20+. ProofAPI seals AI answers on Solana so anyone can check with a link that they were not changed.

```sh
npm install proofapi
```

```ts
import { ProofAPI } from 'proofapi';

const proofapi = new ProofAPI({ apiKey: process.env.PROOFAPI_API_KEY });
const record = await proofapi.seal({
  input: 'Classify support ticket #42',
  output: 'billing',
  model: 'your-model',
  label: 'support-agent',
});
console.log(record.certificateUrl);
// ANCHORED describes a recorded seal. Check chainError/status before claiming anchoring.
const verification = await proofapi.verify(record.id);
console.log(verification.result.status);
```

Use `baseURL: 'http://127.0.0.1:3000'` for a local server. Without a key, anonymous demo limits apply. Keep keys in server-side environment variables, never in frontend bundles.

`seal` records your existing input and output; it does not call an AI provider. Works after responses from OpenAI, Gemini, OpenRouter or any other source; no provider plugin is installed by this package.

Methods: `seal({ input, output, model?, label? })`, `sealHashes({ inputHash, outputHash, metadataHash, agentId?, toolName? })`, `verify(id)`, `evidence(id)`. The 0.1 snake_case form of `sealHashes` is still accepted. `sha256Hex(text)` returns a SHA-256 fingerprint for `sealHashes`. Each method accepts `{ signal }` as a second argument. `ProofAPIError` exposes HTTP `status` and optional `code`. Requests time out after 65 seconds; network and abort errors propagate. Writes are never retried automatically.

For confidential content, hash and salt the input/output/metadata locally and use `sealHashes`. Keep the salt and original bytes so they can be checked later. Only hashes are transmitted in that mode. In text mode, anyone with the certificate URL can download evidence including input/output.

Beta anchors use Solana devnet. A local server configured with `CHAIN_MODE=memory` simulates anchoring. Neither verifies AI accuracy or that a declared model was actually used.

## MCP server for AI agents

The package includes an MCP server, so agents in Claude, Cursor and other MCP clients can seal their own answers without code. Add it to the client's MCP settings:

```json
{
  "mcpServers": {
    "proofapi": {
      "command": "npx",
      "args": ["-y", "-p", "proofapi", "proofapi-mcp"],
      "env": { "PROOFAPI_API_KEY": "pk_live_..." }
    }
  }
}
```

Tools: `seal_answer` (input, output, model?, label?), `seal_hashes` (inputHash, outputHash, metadataHash), `verify_record` (id) and `get_evidence` (id). `PROOFAPI_API_KEY` is optional; `PROOFAPI_BASE_URL` points the server at another deployment.
