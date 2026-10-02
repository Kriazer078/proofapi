# @proofapi/sdk

Preview TypeScript / ESM client for Node.js 20+. This package is built in this repository and is **not yet published to npm**.

Build and install locally:

```sh
cd packages/sdk
npm pack
# From your application's directory:
npm install /absolute/path/to/proofapi-sdk-0.1.0-preview.1.tgz
```

```ts
import { ProofAPI } from '@proofapi/sdk';

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

Methods: `seal({ input, output, model?, label? })`, `sealHashes({ input_hash, output_hash, metadata_hash, agent_id?, tool_name? })`, `verify(id)`, `evidence(id)`. Each method accepts `{ signal }` as a second argument. `ProofAPIError` exposes HTTP `status` and optional `code`. Requests time out after 65 seconds; network and abort errors propagate. Writes are never retried automatically.

For confidential content, hash and salt the input/output/metadata locally and use `sealHashes`. Keep the salt and original bytes so they can be checked later. Only hashes are transmitted in that mode. In text mode, anyone with the certificate URL can download evidence including input/output.

Beta anchors use Solana devnet. A local server configured with `CHAIN_MODE=memory` simulates anchoring. Neither verifies AI accuracy or that a declared model was actually used.
