export const SDK_INSTALL = "npm install proofapi";
export const SEAL_EXAMPLE = `import { ProofAPI } from 'proofapi';

const proofapi = new ProofAPI({
  apiKey: process.env.PROOFAPI_API_KEY,
});

// input and answer come from your application
const record = await proofapi.seal({
  input: 'Classify support ticket #42',
  output: 'billing',
  model: 'your-model',
  label: 'support-agent',
});

console.log(record.status, record.certificateUrl);`;
export const VERIFY_EXAMPLE = `const verification = await proofapi.verify(record.id);
console.log(verification.result.status);
// VERIFIED | FAILED | NOT_ON_CHAIN

const evidence = await proofapi.evidence(record.id);`;

export const MCP_CONFIG = `{
  "mcpServers": {
    "proofapi": {
      "command": "npx",
      "args": ["-y", "-p", "proofapi", "proofapi-mcp"],
      "env": { "PROOFAPI_API_KEY": "pk_live_..." }
    }
  }
}`;
