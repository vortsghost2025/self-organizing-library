const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'lane-worker.js');
let content = fs.readFileSync(filePath, 'utf8');

const oldStr = `\n  _writeWithMetadata(targetPath, msg, decision, schemaResult, signatureResult, remediation = null) {`;

const newStr = `\n  return {
    queue: 'processed',
    reason: gate.reason,
    detail: gate.detail,
    execution_verified: false,
    execution_would_verify: false,
    domain_gate_executed: false,
    verification_outcome: 'NO_PROOF_REQUIRED',
    verification_path: ['response_validation'],
    ownership,
    ownership_notes: ownershipNotes
  };
  }

  _writeWithMetadata(targetPath, msg, decision, schemaResult, signatureResult, remediation = null) {`;

if (content.includes(oldStr)) {
  content = content.replace(oldStr, newStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fix applied successfully');
} else {
  console.log('Pattern not found');
  const idx = content.indexOf('_writeWithMetadata');
  if (idx !== -1) {
    const before = content.substring(idx - 80, idx + 60);
    console.log('Context around _writeWithMetadata:', JSON.stringify(before));
  }
}
