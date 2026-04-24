#!/usr/bin/env node
/**
 * DEPRECATED — DO NOT USE
 * This script was a one-time fix utility that wrote to system_state.json
 * and heartbeat files directly, bypassing the single-source-of-truth chain.
 *
 * INVARIANT: contradictions.json → heartbeat.js → system_state.json
 * Only heartbeat.js may derive and write system_state.json.
 * No other script may write system_state.json.
 */
console.error('[fix-heartbeats-truth] DEPRECATED. Only heartbeat.js may write system_state.json.');
console.error('[fix-heartbeats-truth] Invariant: contradictions → heartbeat → system_state');
process.exit(1);

// Update ALL heartbeats atomically (read + write in same command)
const heartbeats = [
  { path: 'lanes/library/inbox/heartbeat-library.json', name: 'library' },
  { path: 'S:/Archivist-Agent/lanes/archivist/inbox/heartbeat-archivist.json', name: 'archivist' },
  { path: 'S:/kernel-lane/lanes/kernel/inbox/heartbeat-kernel.json', name: 'kernel' },
  { path: 'S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/swarmmind/inbox/heartbeat-swarmmind.json', name: 'swarmmind' }
];

heartbeats.forEach(hb => {
  if (!fs.existsSync(hb.path)) {
    console.log(hb.name + ': MISSING');
    return;
  }
  try {
    const data = JSON.parse(fs.readFileSync(hb.path, 'utf8'));
    
    // TRUTH: set system_status based on ACTUAL contradictions
    data.system_status = activeCount > 0 ? 'degraded' : 'healthy';
    data.active_contradictions = activeCount;
    
    // Remove processed_ok unless backed by proof
    if (data.processed_ok && !data.completion_proof) {
      delete data.processed_ok;
      console.log(hb.name + ': Removed processed_ok (no proof)');
    }
    
    fs.writeFileSync(hb.path, JSON.stringify(data, null, 2));
    console.log('✅ ' + hb.name + ': system_status=' + data.system_status + ', active_contradictions=' + data.active_contradictions);
  } catch(e) {
    console.log('❌ ' + hb.name + ': ERROR - ' + e.message);
  }
});

// Also update system_state.json files
const sysStates = [
  'lanes/broadcast/system_state.json',
  'S:/Archivist-Agent/lanes/broadcast/system_state.json',
  'S:/kernel-lane/lanes/broadcast/system_state.json',
  'S:/SwarmMind Self-Optimizing Multi-Agent AI System/lanes/broadcast/system_state.json'
];
sysStates.forEach(p => {
  if (!fs.existsSync(p)) { console.log('MISSING:', p); return; }
  try {
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    s.system_status = activeCount > 0 ? 'degraded' : 'aligned';
    s.active_contradictions = contradictions;
    s.last_updated = new Date().toISOString();
    if (!('compaction_enabled' in s)) s.compaction_enabled = false;
    console.error('[fix-heartbeats-truth] SKIPPED: Only heartbeat.js may write system_state.json');
    console.log('✅ ' + path.basename(path.dirname(path.dirname(p))) + ': system_status=' + s.system_status + ', contradictions=' + s.active_contradictions.length);
  } catch(e) { console.log('❌ ERROR:', p, e.message); }
});
