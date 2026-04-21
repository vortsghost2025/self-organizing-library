#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { validate } = require('../src/lane/SchemaValidator');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/validate-message.js <path-to-json-file>');
  console.error('       node scripts/validate-message.js --dir <directory>');
  process.exit(1);
}

function validateFile(filePath) {
  const filename = path.basename(filePath);

  // Skip heartbeat files and non-JSON
  if (filename.startsWith('heartbeat-') || !filename.endsWith('.json')) {
    return null;
  }

  try {
    const message = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const result = validate(message);

    if (result.valid) {
      console.log(`  PASS: ${filename}`);
      return true;
    } else {
      console.log(`  FAIL: ${filename}`);
      result.errors.forEach(err => console.log(`    - ${err}`));
      return false;
    }
  } catch (err) {
    console.log(`  ERROR: ${filename} — ${err.message}`);
    return false;
  }
}

if (args[0] === '--dir') {
  const dirPath = args[1];
  if (!dirPath) {
    console.error('Error: --dir requires a directory path');
    process.exit(1);
  }

  if (!fs.existsSync(dirPath)) {
    console.error(`Error: Directory not found: ${dirPath}`);
    process.exit(1);
  }

  console.log(`Validating all .json files in: ${dirPath}\n`);

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json') && !f.startsWith('heartbeat-'));
  let passed = 0;
  let failed = 0;

  files.forEach(file => {
    const result = validateFile(path.join(dirPath, file));
    if (result === true) passed++;
    else if (result === false) failed++;
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${files.length} total`);
  process.exit(failed > 0 ? 1 : 0);
} else {
  const filePath = path.resolve(args[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Validating: ${path.basename(filePath)}\n`);
  const result = validateFile(filePath);

  if (result === true) {
    console.log('\nValidation PASS');
    process.exit(0);
  } else {
    console.log('\nValidation FAIL');
    process.exit(1);
  }
}
