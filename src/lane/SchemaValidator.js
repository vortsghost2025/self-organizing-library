const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

class SchemaValidator {
  constructor() {
    this.schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../schemas/inbox-message-v1.json')));
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(this.schema);
  }

  validate(message) {
    const valid = this.validate(message);
    if (!valid) {
      return { valid: false, errors: this.validate.errors };
    }
    return { valid: true, errors: [] };
  }

  validateAndThrow(message) {
    const result = this.validate(message);
    if (!result) {
      throw new Error('Validation failed: ' + JSON.stringify(this.validate.errors));
    }
  }

  createMessage(template) {
    // Create a schema-compliant message from a partial template
    const message = {
      ...template,
      schema_version: this.schema.properties.schema_version.default,
      timestamp: new Date().toISOString(),
      idempotency_key: this.computeIdempotencyKey(template)
    };
    return message;
  }

  computeIdempotencyKey({ task_id, from, to, subject }) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(`${task_id}${from}${to}${subject}`).digest('hex');
  }
}

module.exports = new SchemaValidator();