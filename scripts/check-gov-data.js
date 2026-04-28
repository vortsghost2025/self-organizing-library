const https = require('https');
function check() {
  https.get('https://deliberateensemble.works/api/graph-data', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const j = JSON.parse(d);
        const n = (j.nodes || [])[0];
        if (n && n.governanceLayer) {
          console.log('GOVERNANCE DATA PRESENT');
          const layers = {};
          j.nodes.forEach(node => { layers[node.governanceLayer] = (layers[node.governanceLayer] || 0) + 1; });
          console.log('Layers:', JSON.stringify(layers));
          const bridges = {};
          j.nodes.forEach(node => { bridges[node.bridgeState] = (bridges[node.bridgeState] || 0) + 1; });
          console.log('Bridge states:', JSON.stringify(bridges));
          process.exit(0);
        } else {
          console.log('NO GOV DATA YET - keys:', n ? Object.keys(n).join(', ') : 'no nodes');
          process.exit(1);
        }
      } catch (e) {
        console.log('PARSE ERROR:', e.message);
        process.exit(1);
      }
    });
  }).on('error', (e) => {
    console.log('REQUEST ERROR:', e.message);
    process.exit(1);
  });
}
check();
