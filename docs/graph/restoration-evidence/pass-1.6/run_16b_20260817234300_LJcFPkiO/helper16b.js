const { chromium } = require('C:/Users/seand/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function run() {
  const panelId = process.argv[2];
  const url = process.argv[3];
  const outPath = process.argv[4];
  const waitMs = parseInt(process.argv[5] || '3000', 10);
  const enableLargeText = process.argv[6] === 'large-text';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('[' + panelId + '] Navigating: ' + url + (enableLargeText ? ' [LARGE_TEXT]' : ''));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for Sigma state
  await page.waitForFunction(function() {
    return typeof window.__NEXUS_GRAPH_STATE__ === 'object' && window.__NEXUS_GRAPH_STATE__ !== null;
  }, { timeout: 20000 }).catch(function(e) {
    console.log('[' + panelId + '] WARNING: __NEXUS_GRAPH_STATE__ timeout: ' + e.message);
  });

  await page.waitForTimeout(1000);

  // If large-text, click Aa button and wait for DOM class
  if (enableLargeText) {
    const aaButton = page.locator('[aria-label="Large Text mode"]');
    await aaButton.waitFor({ state: 'visible', timeout: 5000 });
    await aaButton.click();
    await page.waitForFunction(function() {
      return document.documentElement.classList.contains('a11y-large-text');
    }, { timeout: 8000 });
    await page.waitForTimeout(1000);
  }

  await page.waitForTimeout(waitMs);

  // Read large text states
  const ltDom = await page.evaluate(function() {
    return document.documentElement.classList.contains('a11y-large-text');
  });
  const ltAria = await page.evaluate(function() {
    var btn = document.querySelector('[aria-label="Large Text mode"]');
    return btn ? btn.getAttribute('aria-pressed') : 'NOT_FOUND';
  });

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

  // Read node containment using the exact Sigma node positions and sizes against container viewport
  const containment = await page.evaluate(function() {
    var s = window.__NEXUS_GRAPH_STATE__;
    if (s && typeof s.getNodeContainment === 'function') {
      return s.getNodeContainment();
    }
    return null;
  });

  // Read toolbar counter text
  const toolbarText = await page.evaluate(function() {
    var spans = Array.from(document.querySelectorAll('span'));
    var nChip = spans.find(function(el) { return /^\d+ nodes?$/.test((el.textContent || '').trim()); });
    var eChip = spans.find(function(el) { return /^\d+ edges?$/.test((el.textContent || '').trim()); });
    return (nChip ? nChip.textContent.trim() : 'N/A') + ' / ' + (eChip ? eChip.textContent.trim() : 'N/A');
  });

  var capturedAt = new Date().toISOString();
  var runId = path.basename(path.dirname(outPath));
  var outsideCount = containment ? containment.outsideCount : 'N/A';

  var proofLines = [
    'PANEL: ' + panelId,
    'RUN_ID: ' + runId,
    'SIGMA: ' + graphState.renderedNodes + 'n / ' + graphState.renderedEdges + 'e',
    'TOOLBAR: ' + toolbarText,
    'LAYERS: ' + JSON.stringify(graphState.activeLayers),
    'NODE_TOKEN: ' + (graphState.requestedNodeToken || 'null'),
    'RESOLVED: ' + (graphState.resolvedNodeId || 'null'),
    'RES_METHOD: ' + (graphState.resolutionMethod || 'N/A'),
    'LARGE_TEXT_DOM: ' + ltDom,
    'LARGE_TEXT_ARIA: ' + ltAria,
    'NODES_OUTSIDE_VIEWPORT: ' + outsideCount,
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

  console.log('RESULT_JSON:' + JSON.stringify({
    panelId: panelId,
    hash: hash,
    fileSize: fileBytes.length,
    toolbarText: toolbarText,
    largeTextActive: ltDom,
    aaButtonPressed: ltAria,
    graphState: graphState,
    containment: containment,
    capturedAt: capturedAt
  }));
}

run().catch(function(err) {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
