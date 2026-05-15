const {createSignedMessage} = require('./scripts/create-signed-message.js');
const msg = {
  schema_version: '1.3',
  task_id: 'sign-test-' + Date.now(),
  from: 'library',
  to: 'archivist',
  priority: 'P2',
  type: 'notification',
  task_kind: 'status',
  subject: 'Signing test',
  body: 'Testing',
  timestamp: new Date().toISOString(),
  confidence: 8
};
// Correct argument order: createSignedMessage(msg, laneId)
createSignedMessage(msg, 'library').then(r => console.log('SUCCESS:', JSON.stringify(r).substring(0,500))).catch(e => { console.error('ERROR:', e.message); console.error('STACK:', e.stack); });
