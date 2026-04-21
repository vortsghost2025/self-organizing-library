const fs = require('fs');
const path = require('path');
const SchemaValidator = require('../src/lane/SchemaValidator');

function processMessage(message) {
  const validation = SchemaValidator.validate(message);
  if (!validation.valid) {
    fs.appendFileSync('watcher.log', `Message validation failed: ${JSON.stringify(validation.errors)}\n`);
    return;
  }
  // Continue processing message
  // ...
}

function validateMessages(inboxPath) {
  const files = fs.readdirSync(inboxPath);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const message = JSON.parse(fs.readFileSync(path.join(inboxPath, file), 'utf8'));
      const validation = SchemaValidator.validate(message);
      console.log(message);
      if (!validation.valid) {
        console.log(`Validation FAIL for ${file}: ${JSON.stringify(validation.errors)}`);
      } else {
        console.log(`Validation PASS for ${file}`);
      }
    }
  }
}

module.exports = { processMessage, validateMessages };