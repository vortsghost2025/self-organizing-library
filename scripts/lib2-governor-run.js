#!/usr/bin/env node
'use strict';
process.env.AGENT_MODE = 'governing';
const path = require('path');
const { InboxWatcher } = require('./inbox-watcher');

const repoRoot = path.join(__dirname);
const libInbox = path.join(repoRoot, 'lanes', 'library', 'inbox');

const watcher = new InboxWatcher({
  laneName: 'library',
  agentMode: 'governing',
  inboxPath: libInbox,
  processedPath: path.join(libInbox, 'processed'),
  expiredPath: path.join(libInbox, 'expired'),
  quarantinePath: path.join(libInbox, 'quarantine'),
  actionRequiredPath: path.join(libInbox, 'action-required'),
  outboxPath: path.join(repoRoot, 'lanes', 'library', 'outbox')
});

watcher.run().then(count => {
  console.log('[lib2-governor] Processed', count, 'messages');
  process.exit(0);
}).catch(err => {
  console.error('[lib2-governor] Error:', err.message);
  process.exit(1);
});