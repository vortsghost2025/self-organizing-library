# PASS-1.6A ADDENDUM-2 — BLOCKER-2 ONLY: LARGE TEXT DOM FIX
# The previous attempt set aria-pressed=true but DOM class was not yet applied.
# This run clicks the Aa button and waits for the DOM class before capture.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ts = (Get-Date -Format "yyyyMMddHHmmss")
$rnd = -join ((65..90) + (97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$RUN_ID = "addendum2_${ts}_${rnd}"
$BASE_DIR = "S:\self-organizing-library\docs\graph\restoration-evidence\pass-1.6"
$RUN_DIR = Join-Path $BASE_DIR $RUN_ID
New-Item -ItemType Directory -Path $RUN_DIR | Out-Null
Write-Host "RUN_ID: $RUN_ID"

$HELPER_PATH = Join-Path $RUN_DIR "helper2.js"
$helperContent = @"
const { chromium } = require('C:/Users/seand/AppData/Roaming/npm/node_modules/playwright');
const fs = require('fs');
const crypto = require('crypto');

async function run() {
  const outPath = process.argv[2];
  const runId = process.argv[3];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/graph?lens=navigation', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for Sigma to be ready
  await page.waitForFunction(function() {
    return typeof window.__NEXUS_GRAPH_STATE__ === 'object' && window.__NEXUS_GRAPH_STATE__ !== null;
  }, { timeout: 20000 }).catch(function() {});
  await page.waitForTimeout(1500);

  // Click the Aa (Large Text) button
  const aaBtn = page.locator('[aria-label="Large Text mode"]');
  await aaBtn.waitFor({ state: 'visible', timeout: 5000 });
  await aaBtn.click();

  // Wait for the DOM class to actually appear on documentElement
  await page.waitForFunction(function() {
    return document.documentElement.classList.contains('a11y-large-text');
  }, { timeout: 8000 }).catch(function(e) {
    console.log('WARNING: a11y-large-text class did not appear: ' + e.message);
  });

  // Extra settle
  await page.waitForTimeout(1000);

  // Verify DOM and aria state
  const ltDom = await page.evaluate(function() {
    return document.documentElement.classList.contains('a11y-large-text');
  });
  const ltAria = await page.evaluate(function() {
    var btn = document.querySelector('[aria-label="Large Text mode"]');
    return btn ? btn.getAttribute('aria-pressed') : 'NOT_FOUND';
  });

  // Read graph state (should be same navigation default)
  const gs = await page.evaluate(function() {
    var s = window.__NEXUS_GRAPH_STATE__;
    if (!s) return { renderedNodes: -1, renderedEdges: -1, activeLayers: [] };
    return { renderedNodes: s.renderedNodes, renderedEdges: s.renderedEdges, activeLayers: s.activeLayers || [] };
  });

  // Read toolbar
  const toolbarText = await page.evaluate(function() {
    var spans = Array.from(document.querySelectorAll('span'));
    var nChip = spans.find(function(el) { return /^\d+ nodes?$/.test((el.textContent || '').trim()); });
    var eChip = spans.find(function(el) { return /^\d+ edges?$/.test((el.textContent || '').trim()); });
    return (nChip ? nChip.textContent.trim() : 'N/A') + ' / ' + (eChip ? eChip.textContent.trim() : 'N/A');
  });

  // Check that graph fits in viewport (large text should not cause overflow)
  const graphBox = await page.evaluate(function() {
    var canvas = document.querySelector('canvas');
    if (!canvas) return null;
    var rect = canvas.getBoundingClientRect();
    return { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height };
  });
  const viewportFit = graphBox && graphBox.right <= 1440 && graphBox.bottom <= 900;

  var capturedAt = new Date().toISOString();
  var proofLines = [
    'PANEL: F_large_text',
    'RUN_ID: ' + runId,
    'SIGMA: ' + gs.renderedNodes + 'n / ' + gs.renderedEdges + 'e',
    'TOOLBAR: ' + toolbarText,
    'LARGE_TEXT_DOM: ' + ltDom,
    'LARGE_TEXT_ARIA_PRESSED: ' + ltAria,
    'LARGE_TEXT_ENABLED: ' + (ltDom && ltAria === 'true' ? 'YES' : 'NO'),
    'VIEWPORT_FIT: ' + viewportFit,
    'LAYERS: ' + JSON.stringify(gs.activeLayers),
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

  var bytes = fs.readFileSync(outPath);
  var hash = crypto.createHash('sha256').update(bytes).digest('hex');
  await browser.close();

  console.log('RESULT_JSON:' + JSON.stringify({
    hash: hash, fileSize: bytes.length,
    ltDom: ltDom, ltAria: ltAria,
    sigmaNodes: gs.renderedNodes, sigmaEdges: gs.renderedEdges,
    toolbarText: toolbarText, viewportFit: viewportFit,
    capturedAt: capturedAt
  }));
}

run().catch(function(e) { console.error('FATAL: ' + e.message); process.exit(1); });
"@

$helperContent | Out-File -FilePath $HELPER_PATH -Encoding UTF8

$outPath = Join-Path $RUN_DIR "F_large_text.png"
Write-Host "=== CAPTURING: F_large_text (BLOCKER-2 retry) ==="

$nodeOut = node $HELPER_PATH $outPath $RUN_ID 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "CAPTURE FAILED:"; Write-Host ($nodeOut -join "`n"); exit 1
}

$resultLine = $nodeOut | Where-Object { $_ -match '^RESULT_JSON:' } | Select-Object -Last 1
$parsed = $null
if ($resultLine) {
    try { $parsed = ($resultLine -replace '^RESULT_JSON:','') | ConvertFrom-Json } catch { }
}

$fileBytes = [System.IO.File]::ReadAllBytes($outPath)
$sha = [System.Security.Cryptography.SHA256]::Create()
$localHash = (($sha.ComputeHash($fileBytes)) | ForEach-Object { $_.ToString("x2") }) -join ""

$nodeHash = if ($parsed) { $parsed.hash } else { "PARSE_FAILED" }
$hashMatch = ($localHash -eq $nodeHash)
$ltDom = if ($parsed) { $parsed.ltDom } else { $false }
$ltAria = if ($parsed) { $parsed.ltAria } else { "UNKNOWN" }
$b2pass = ($ltDom -eq $true -and $ltAria -eq "true")

Write-Host "  LocalSHA256:       $localHash"
Write-Host "  HashesMatch:       $hashMatch"
Write-Host "  Sigma:             $($parsed.sigmaNodes)n / $($parsed.sigmaEdges)e"
Write-Host "  Toolbar:           $($parsed.toolbarText)"
Write-Host "  LARGE_TEXT_DOM:    $ltDom"
Write-Host "  LARGE_TEXT_ARIA:   $ltAria"
Write-Host "  ViewportFit:       $($parsed.viewportFit)"
Write-Host "  BLOCKER-2:         $(if ($b2pass) { 'PASS' } else { 'FAIL' })"

# Manifest
$manifestPath = Join-Path $RUN_DIR "ADDENDUM2-MANIFEST.txt"
@(
    "=== PASS-1.6A ADDENDUM-2 MANIFEST (BLOCKER-2 ONLY) ===",
    "RUN_ID: $RUN_ID",
    "CREATED_AT: $(Get-Date -Format o)",
    "PARENT_ADDENDUM: addendum_20260817232828_kruLWmYg",
    "PARENT_BASE_RUN: run_20260817231151_laRXBFgV",
    "",
    "BLOCKER_2_LARGE_TEXT_ACTUALLY_ENABLED: $(if ($b2pass) { 'YES' } else { 'NO' })",
    "LARGE_TEXT_DOM_CLASS: $ltDom",
    "LARGE_TEXT_ARIA_PRESSED: $ltAria",
    "VIEWPORT_FIT: $($parsed.viewportFit)",
    "",
    "--- F_large_text ---",
    "ABSOLUTE_PATH: $outPath",
    "SHA256: $localHash",
    "HASH_MATCH: $hashMatch",
    "FILE_SIZE_BYTES: $($fileBytes.Length)",
    "SIGMA_NODES: $($parsed.sigmaNodes)",
    "SIGMA_EDGES: $($parsed.sigmaEdges)",
    "TOOLBAR_TEXT: $($parsed.toolbarText)",
    "LARGE_TEXT_DOM: $ltDom",
    "LARGE_TEXT_ARIA_PRESSED: $ltAria",
    "VIEWPORT_FIT: $($parsed.viewportFit)",
    "CAPTURED_AT: $($parsed.capturedAt)",
    "",
    "BLOCKER_1_TOOLBAR_SIGMA_EDGES_MATCH: YES (from addendum_20260817232828_kruLWmYg)",
    "BLOCKER_2_LARGE_TEXT_ACTUALLY_ENABLED: $(if ($b2pass) { 'YES' } else { 'NO' })",
    "BLOCKER_3_CANONICAL_ALIAS_PROVEN: NO (alias was invented in pass-1.6, not pre-existing)",
    "BLOCKER_3_EXACT_NODE_ID_RESOLUTION: YES (from addendum_20260817232828_kruLWmYg)",
    "GRAPH_DATA_CHANGED: NO",
    "READY_FOR_COMMIT_REVIEW: $(if ($b2pass -and $hashMatch) { 'YES' } else { 'NO' })"
) | Out-File -FilePath $manifestPath -Encoding UTF8

Write-Host ""
Write-Host "Manifest: $manifestPath"
Write-Host ""
Write-Host "============================================"
Write-Host "BLOCKER_1_TOOLBAR_SIGMA_EDGES_MATCH:  YES"
Write-Host "BLOCKER_2_LARGE_TEXT_ACTUALLY_ENABLED: $(if ($b2pass) { 'YES' } else { 'NO' })"
Write-Host "BLOCKER_3_EXACT_NODE_ID_RESOLUTION:   YES"
Write-Host "BLOCKER_3_CANONICAL_ALIAS_PROVEN:     NO"
Write-Host "GRAPH_DATA_CHANGED:                   NO"
Write-Host "READY_FOR_COMMIT_REVIEW:              $(if ($b2pass -and $hashMatch) { 'YES' } else { 'NO' })"
Write-Host "============================================"
