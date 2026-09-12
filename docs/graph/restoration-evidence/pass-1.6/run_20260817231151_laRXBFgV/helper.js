const { chromium } = require('C:/Users/seand/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function run() {
  const panelId = process.argv[2];
  const url = process.argv[3];
  const outPath = process.argv[4];
  const waitMs = parseInt(process.argv[5] || '2500', 10);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[' + panelId + '] Navigating: ' + url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for Sigma state to be available
  await page.waitForFunction(function() {
    return typeof window.__NEXUS_GRAPH_STATE__ === 'object' && window.__NEXUS_GRAPH_STATE__ !== null;
  }, { timeout: 20000 }).catch(function(e) {
    console.log('[' + panelId + '] WARNING: __NEXUS_GRAPH_STATE__ timeout: ' + e.message);
  });

  // Extra settle time
  await page.waitForTimeout(waitMs);

  // Read graph state
  const graphState = await page.evaluate(function() {
    var s = window.__NEXUS_GRAPH_STATE__;
    if (!s) return { renderedNodes: -1, renderedEdges: -1, activeClusterId: null, selectedNodeId: null, requestedNodeToken: null, resolvedNodeId: null, resolvedNodeTitle: null, resolutionMethod: 'NO_STATE', activeEntryPoint: null, activeLayers: [] };
    return {
      renderedNodes: s.renderedNodes,
      renderedEdges: s.renderedEdges,
      activeClusterId: s.activeClusterId || null,
      selectedNodeId: s.selectedNodeId || null,
      requestedNodeToken: s.requestedNodeToken || null,
      resolvedNodeId: s.resolvedNodeId || null,
      resolvedNodeTitle: s.resolvedNodeTitle || null,
      resolutionMethod: s.resolutionMethod || 'UNKNOWN',
      activeEntryPoint: s.activeEntryPoint || null,
      activeLayers: s.activeLayers || []
    };
  });

  // Read toolbar counter text
  const toolbarText = await page.evaluate(function() {
    var spans = Array.from(document.querySelectorAll('span,div,p'));
    var matches = spans.map(function(el) { return el.textContent ? el.textContent.trim() : ''; })
      .filter(function(t) { return /^[0-9]+ node/.test(t) || /[0-9]+ nodes/.test(t); });
    return matches.slice(0,3).join(' | ') || 'NOT_FOUND';
  });

  // Inject self-proof overlay
  var capturedAt = new Date().toISOString();
  var runId = path.basename(path.dirname(outPath));
  var proofLines = [
    'PANEL: ' + panelId,
    'RUN_ID: ' + runId,
    'SIGMA: ' + graphState.renderedNodes + 'n / ' + graphState.renderedEdges + 'e',
    'CLUSTER: ' + (graphState.activeClusterId || 'null'),
    'NODE_TOKEN: ' + (graphState.requestedNodeToken || 'null'),
    'RESOLVED: ' + (graphState.resolvedNodeId || 'null'),
    'RES_METHOD: ' + (graphState.resolutionMethod || 'N/A'),
    'EP: ' + (graphState.activeEntryPoint || 'null'),
    'LAYERS: ' + JSON.stringify(graphState.activeLayers),
    'TOOLBAR: ' + toolbarText.substring(0,60),
    'AT: ' + capturedAt.substring(0,19) + 'Z'
  ];

  await page.evaluate(function(lines) {
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:6px;right:6px;background:rgba(0,0,0,0.93);color:#00ff88;font-family:monospace;font-size:10.5px;line-height:1.5;padding:8px 12px;border-radius:5px;z-index:999999;pointer-events:none;border:1.5px solid #00ff88;max-width:440px';
    div.innerHTML = lines.map(function(l) { return '<div>' + l + '</div>'; }).join('');
    document.body.appendChild(div);
  }, proofLines);

  await page.waitForTimeout(150);
  await page.screenshot({ path: outPath });

  var fileBytes = fs.readFileSync(outPath);
  var hash = crypto.createHash('sha256').update(fileBytes).digest('hex');

  await browser.close();

  var result = {
    panelId: panelId,
    hash: hash,
    fileSize: fileBytes.length,
    toolbarText: toolbarText,
    graphState: graphState,
    capturedAt: capturedAt
  };
  console.log('RESULT_JSON:' + JSON.stringify(result));
}

run().catch(function(err) {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
