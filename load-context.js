#!/usr/bin/env node
/**
 * Load Context - Library lane
 * 
 * Run at session start to load previous session memory.
 */

const { getSessionMemory } = require('./src/memory/SessionMemory.js');
const { IdentityStore } = require('./src/identity/IdentityStore.js');

const identityStore = new IdentityStore();
const identityBootstrap = identityStore.bootstrap({ readOnlyIfMissing: true });

if (identityBootstrap.loaded) {
  console.log(
    `[Identity] loaded lane=${identityBootstrap.identity.laneId} session=${identityBootstrap.identity.sessionId}`
  );
} else {
  console.log(
    `[Identity] not loaded (${identityBootstrap.reason}) at ${identityBootstrap.identityPath}`
  );
}

const memory = getSessionMemory();
const context = memory.generateContext();

console.log(context);
console.log('\n---\n');
console.log('Current session:', memory.getCurrentSession().id);
console.log('Started:', memory.getCurrentSession().started);
