const fs = require('fs');
const path = require('path');

// Get ACTUAL active contradiction count
const contraPath = 'S:/Archivist-Agent/lanes/broadcast/contradictions.json';
let activeCount = 0;
let contradictions = [];
try {
  contradictions = JSON.parse(fs.readFileSync(contraPath, 'utf8'));
  activeCount = contradictions.filter(c => c.status === 'active' || c.status === 'resolving').length;
} catch(e) { console.log('ERROR reading contradictions:', e.message); }

console.log('=== THE TRUTH (No Lies) ===');
console.log('Active/resolving contradictions:', activeCount);
contradictions.forEach(c => {
  console.log('  [' + c.status + '] ' + c.id + ' - ' + c.description);
});

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
    fs.writeFileSync(p, JSON.stringify(s, null, 2));
    console.log('✅ ' + path.basename(path.dirname(path.dirname(p))) + ': system_status=' + s.system_status + ', contradictions=' + s.active_contradictions.length);
  } catch(e) { console.log('❌ ERROR:', p, e.message); }
});
