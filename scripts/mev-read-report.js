const fs = require('fs');
const path = require('path');
const reportPath = path.join('C:', 'mev-bot-clean', 'dedup-report.json');
const r = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
console.log('File counts by dir:');
Object.entries(r.fileCountsByDir).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
console.log('Total:', r.totalFilesInOutput);
