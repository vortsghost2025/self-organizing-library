#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const SchemaValidator = require('../src/lane/SchemaValidator');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/validate-message.js <path-to-json-file> | --dir <directory>');
  process.exit(1);
}

const validateMessage = (filePath) => {
  const message = JSON.parse(fs.readFileSync(filePath));
  const validation = SchemaValidator.validate(message);
  if (!validation.valid) {
    console.log('Validation FAIL: ', validation.errors);
    process.exit(1);
  } else {
    console.log('Validation PASS: Message is valid.');
    process.exit(0);
  }
};

if (args[0] === '--dir') {
  const dirPath = args[1];
  fs.readdirSync(dirPath).forEach(file => {
    if (file.endsWith('.json')) {
      validateMessage(path.join(dirPath, file));
    }
  });
} else {
  validateMessage(args[0]);
}