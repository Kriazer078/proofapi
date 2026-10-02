export const SDK_ARCHIVE = "proofapi-sdk-0.1.0-preview.1.tgz";
export const SDK_DOWNLOAD = `/downloads/${SDK_ARCHIVE}`;
export const SDK_INSTALL = `npm install ./${SDK_ARCHIVE}`;
export const SEAL_EXAMPLE = `import { ProofAPI } from '@proofapi/sdk';

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
