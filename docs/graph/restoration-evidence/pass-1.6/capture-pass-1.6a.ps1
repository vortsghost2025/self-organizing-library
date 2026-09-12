# ===========================================================================
# PASS-1.6A ADDENDUM CAPTURE — THREE ACCEPTANCE BLOCKERS ONLY
# ===========================================================================
# Fixes addressed:
#   BLOCKER-1: A10 toolbar=2/Sigma=1 -> now both use deduplicatedEdgeCount
#   BLOCKER-2: F panel uses real Large Text accessibility toggle, not density=focus
#   BLOCKER-3: C panel uses raw node ID (no unverified slug alias)
#
# Captures: A (default, edge fix), F (large text), C (node focus, raw ID)
# No recapture of B, D, E (unchanged and valid from pass-1.6)
# ===========================================================================
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ts = (Get-Date -Format "yyyyMMddHHmmss")
$rnd = -join ((65..90) + (97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$RUN_ID = "addendum_${ts}_${rnd}"
$BASE_DIR = "S:\self-organizing-library\docs\graph\restoration-evidence\pass-1.6"
$RUN_DIR = Join-Path $BASE_DIR $RUN_ID

if (Test-Path $RUN_DIR) {
    Write-Error "ABORT: Dir already exists: $RUN_DIR"
    exit 1
}
New-Item -ItemType Directory -Path $RUN_DIR | Out-Null
Write-Host "=== PASS-1.6A ADDENDUM CAPTURE ==="
Write-Host "RUN_ID: $RUN_ID"
Write-Host "RUN_DIR: $RUN_DIR"
Write-Host "STARTED: $(Get-Date -Format o)"

# Helper JS
$HELPER_PATH = Join-Path $RUN_DIR "helper.js"
$helperContent = @"
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
  const rawNodeId = process.argv[7] || null;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: enableLargeText ? {
      localStorage: [{ name: 'de-a11y-mode', value: 'large-text', url: 'http://localhost:3000' }]
    } : undefined
  });
  const page = await context.newPage();

  // For large-text mode: set localStorage before navigation
  if (enableLargeText) {
    await context.addInitScript(function() {
      localStorage.setItem('de-a11y-mode', 'large-text');
    });
  }

  console.log('[' + panelId + '] Navigating: ' + url + (enableLargeText ? ' [LARGE_TEXT]' : ''));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // If large-text, also click the Aa button to ensure React state picks it up
  if (enableLargeText) {
    const aaButton = page.locator('[aria-label="Large Text mode"]');
    const isActive = await aaButton.getAttribute('aria-pressed').catch(function() { return 'false'; });
    if (isActive !== 'true') {
      await aaButton.click().catch(function(e) { console.log('Aa click failed: ' + e.message); });
      await page.waitForTimeout(500);
    }
  }

  // Wait for Sigma state
  await page.waitForFunction(function() {
    return typeof window.__NEXUS_GRAPH_STATE__ === 'object' && window.__NEXUS_GRAPH_STATE__ !== null;
  }, { timeout: 20000 }).catch(function(e) {
    console.log('[' + panelId + '] WARNING: __NEXUS_GRAPH_STATE__ timeout: ' + e.message);
  });

  await page.waitForTimeout(waitMs);

  // Read large-text actual state from DOM
  const largeTextActive = await page.evaluate(function() {
    return document.documentElement.classList.contains('a11y-large-text');
  });

  // Read Aa button aria-pressed
  const aaButtonPressed = await page.evaluate(function() {
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

  // Read toolbar counter text (look for "N nodes" pattern)
  const toolbarText = await page.evaluate(function() {
    // Get the toolbar chip text directly from the data-testid or known location
    var chips = Array.from(document.querySelectorAll('span'));
    var nodeChip = chips.find(function(el) { return /^\d+ nodes?$/.test(el.textContent ? el.textContent.trim() : ''); });
    var edgeChip = chips.find(function(el) { return /^\d+ edges?$/.test(el.textContent ? el.textContent.trim() : ''); });
    var nodeText = nodeChip ? nodeChip.textContent.trim() : 'N/A';
    var edgeText = edgeChip ? edgeChip.textContent.trim() : 'N/A';
    return nodeText + ' / ' + edgeText;
  });

  // Inject self-proof overlay
  var capturedAt = new Date().toISOString();
  var runId = path.basename(path.dirname(outPath));
  var proofLines = [
    'PANEL: ' + panelId,
    'RUN_ID: ' + runId,
    'SIGMA: ' + graphState.renderedNodes + 'n / ' + graphState.renderedEdges + 'e',
    'TOOLBAR: ' + toolbarText,
    'CLUSTER: ' + (graphState.activeClusterId || 'null'),
    'NODE_TOKEN: ' + (graphState.requestedNodeToken || 'null'),
    'RESOLVED: ' + (graphState.resolvedNodeId || 'null'),
    'RES_METHOD: ' + (graphState.resolutionMethod || 'N/A'),
    'EP: ' + (graphState.activeEntryPoint || 'null'),
    'LAYERS: ' + JSON.stringify(graphState.activeLayers),
    'LARGE_TEXT_DOM: ' + largeTextActive,
    'LARGE_TEXT_ARIA: ' + aaButtonPressed,
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
    largeTextActive: largeTextActive,
    aaButtonPressed: aaButtonPressed,
    graphState: graphState,
    capturedAt: capturedAt
  };
  console.log('RESULT_JSON:' + JSON.stringify(result));
}

run().catch(function(err) {
  console.error('FATAL: ' + err.message);
  process.exit(1);
});
"@

$helperContent | Out-File -FilePath $HELPER_PATH -Encoding UTF8
Write-Host "Helper written: $HELPER_PATH"

$BASE_URL = "http://localhost:3000/graph"

# THREE PANELS ONLY
# A: default view — proves toolbar and Sigma now agree after dedup fix
# C: focus on raw node ID 2abc406c3496acfd (ARCHIVISTINTERNALSTRUCTURE.md) — no alias
# F: Large Text accessibility mode ON
$panels = @(
    [PSCustomObject]@{
        Id="A_default_edgefix"
        Url="${BASE_URL}?lens=navigation"
        WaitMs=3000
        LargeText=$false
        Expect="navigation default. BLOCKER-1 FIX: toolbar and Sigma must both show same deduplicated edge count"
    },
    [PSCustomObject]@{
        Id="C_focus_rawid"
        Url="${BASE_URL}?lens=authority&selectedNode=2abc406c3496acfd"
        WaitMs=4000
        LargeText=$false
        Expect="authority focus using raw node ID. BLOCKER-3: resolutionMethod=exact_node_id, no alias claim"
    },
    [PSCustomObject]@{
        Id="F_large_text"
        Url="${BASE_URL}?lens=navigation"
        WaitMs=3500
        LargeText=$true
        Expect="navigation default with Large Text accessibility. BLOCKER-2: LARGE_TEXT_DOM=true, LARGE_TEXT_ARIA=true"
    }
)

$results = [System.Collections.ArrayList]::new()

foreach ($panel in $panels) {
    $outPath = Join-Path $RUN_DIR "$($panel.Id).png"
    Write-Host ""
    Write-Host "=== CAPTURING: $($panel.Id) ==="
    Write-Host "URL: $($panel.Url)"
    Write-Host "LargeText: $($panel.LargeText)"
    Write-Host "Expected: $($panel.Expect)"

    if (Test-Path $outPath) {
        Write-Error "ABORT: File already exists: $outPath"
        exit 1
    }

    $ltArg = if ($panel.LargeText) { "large-text" } else { "no" }
    $nodeOut = node $HELPER_PATH $panel.Id $panel.Url $outPath $panel.WaitMs $ltArg 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "CAPTURE FAILED (exit $LASTEXITCODE):"
        Write-Host ($nodeOut -join "`n")
        exit 1
    }

    $resultLine = $nodeOut | Where-Object { $_ -match '^RESULT_JSON:' } | Select-Object -Last 1
    $parsed = $null
    if ($resultLine) {
        $jsonStr = $resultLine -replace '^RESULT_JSON:', ''
        try { $parsed = $jsonStr | ConvertFrom-Json } catch { Write-Host "WARNING: JSON parse error: $_" }
    }

    if (-not (Test-Path $outPath)) {
        Write-Error "ABORT: Screenshot not created: $outPath"
        exit 1
    }
    $fileBytes = [System.IO.File]::ReadAllBytes($outPath)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($fileBytes)
    $localHash = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""

    $nodeHash = if ($parsed) { $parsed.hash } else { "PARSE_FAILED" }
    $hashMatch = ($localHash -eq $nodeHash)

    $sigmaNodes     = if ($parsed) { $parsed.graphState.renderedNodes } else { -99 }
    $sigmaEdges     = if ($parsed) { $parsed.graphState.renderedEdges } else { -99 }
    $toolbarText    = if ($parsed) { $parsed.toolbarText } else { "UNKNOWN" }
    $ltDom          = if ($parsed) { $parsed.largeTextActive } else { "UNKNOWN" }
    $ltAria         = if ($parsed) { $parsed.aaButtonPressed } else { "UNKNOWN" }
    $resolutionMethod = if ($parsed) { $parsed.graphState.resolutionMethod } else { "UNKNOWN" }
    $resolvedId     = if ($parsed) { $parsed.graphState.resolvedNodeId } else { "UNKNOWN" }

    # BLOCKER-1 check: parse toolbar edge count and compare to Sigma
    $toolbarEdges = "UNKNOWN"
    if ($toolbarText -match '(\d+) edges?') {
        $toolbarEdges = $Matches[1]
    }
    $toolbarNodes = "UNKNOWN"
    if ($toolbarText -match '(\d+) nodes?') {
        $toolbarNodes = $Matches[1]
    }
    $edgesMatch = ($toolbarEdges -eq $sigmaEdges.ToString())

    $r = [PSCustomObject]@{
        PanelId          = $panel.Id
        Url              = $panel.Url
        OutPath          = $outPath
        LocalSHA256      = $localHash
        NodeHash         = $nodeHash
        HashesMatch      = $hashMatch
        FileSizeBytes    = $fileBytes.Length
        SigmaNodes       = $sigmaNodes
        SigmaEdges       = $sigmaEdges
        ToolbarText      = $toolbarText
        ToolbarNodes     = $toolbarNodes
        ToolbarEdges     = $toolbarEdges
        EdgesMismatch    = (-not $edgesMatch)
        LargeTextDOM     = $ltDom
        LargeTextAria    = $ltAria
        ResolutionMethod = $resolutionMethod
        ResolvedId       = $resolvedId
        CapturedAt       = if ($parsed) { $parsed.capturedAt } else { (Get-Date -Format o) }
        Expect           = $panel.Expect
    }

    Write-Host "  LocalSHA256:    $localHash"
    Write-Host "  HashesMatch:    $hashMatch"
    Write-Host "  Sigma:          $sigmaNodes nodes / $sigmaEdges edges"
    Write-Host "  Toolbar:        $toolbarText"
    Write-Host "  Toolbar edges:  $toolbarEdges  |  Sigma edges: $sigmaEdges  |  Match: $edgesMatch"
    Write-Host "  LargeText DOM:  $ltDom"
    Write-Host "  LargeText Aria: $ltAria"
    Write-Host "  Resolution:     $resolutionMethod -> $resolvedId"

    $null = $results.Add($r)
}

Write-Host ""
Write-Host "=== ALL ADDENDUM PANELS CAPTURED ==="

# ACCEPTANCE CHECKS
$b1_pass = (-not ($results | Where-Object { $_.PanelId -eq "A_default_edgefix" -and $_.EdgesMismatch }))
$b2_panel = $results | Where-Object { $_.PanelId -eq "F_large_text" }
$b2_pass = ($b2_panel -and $b2_panel.LargeTextDOM -eq $true -and $b2_panel.LargeTextAria -eq "true")
$b3_panel = $results | Where-Object { $_.PanelId -eq "C_focus_rawid" }
$b3_pass = ($b3_panel -and $b3_panel.ResolutionMethod -eq "exact_node_id")

Write-Host ""
Write-Host "ACCEPTANCE RESULTS:"
Write-Host "  BLOCKER-1 (toolbar==sigma edges):   $(if ($b1_pass) { 'PASS' } else { 'FAIL' })"
Write-Host "  BLOCKER-2 (large text DOM active):  $(if ($b2_pass) { 'PASS' } else { 'FAIL' }) (DOM=$($b2_panel.LargeTextDOM), Aria=$($b2_panel.LargeTextAria))"
Write-Host "  BLOCKER-3 (exact_node_id method):   $(if ($b3_pass) { 'PASS' } else { 'FAIL' }) ($($b3_panel.ResolutionMethod))"

# Hash uniqueness
$allHashes = @($results | ForEach-Object { $_.LocalSHA256 })
$uniqueCount = ($allHashes | Sort-Object -Unique).Count
$allUnique = ($uniqueCount -eq $allHashes.Count)
Write-Host "  ALL_HASHES_UNIQUE:                  $(if ($allUnique) { 'PASS' } else { 'FAIL' })"

$readyForReview = $b1_pass -and $b2_pass -and $b3_pass -and $allUnique

# Write addendum manifest
$manifestPath = Join-Path $RUN_DIR "ADDENDUM-MANIFEST.txt"
$lines = [System.Collections.ArrayList]::new()
$null = $lines.Add("=== PASS-1.6A ADDENDUM MANIFEST ===")
$null = $lines.Add("RUN_ID: $RUN_ID")
$null = $lines.Add("CREATED_AT: $(Get-Date -Format o)")
$null = $lines.Add("PARENT_RUN: run_20260817231151_laRXBFgV")
$null = $lines.Add("BLOCKER_1_TOOLBAR_SIGMA_EDGES_MATCH: $(if ($b1_pass) { 'YES' } else { 'NO' })")
$null = $lines.Add("BLOCKER_2_LARGE_TEXT_ACTUALLY_ENABLED: $(if ($b2_pass) { 'YES' } else { 'NO' })")
$null = $lines.Add("BLOCKER_3_CANONICAL_ALIAS_PROVEN: NO (alias invented in pass-1.6, not pre-existing)")
$null = $lines.Add("BLOCKER_3_EXACT_NODE_ID_RESOLUTION: $(if ($b3_pass) { 'YES' } else { 'NO' })")
$null = $lines.Add("CANONICAL_ALIAS_SOURCE_FILE: NexusGraph.tsx (CANONICAL_SLUG_MAP)")
$null = $lines.Add("ALIAS_PREEXISTED_PASS_1_6: NO (not present in any committed version)")
$null = $lines.Add("FOCUS_PANEL_NOW_USES_RAW_ID: 2abc406c3496acfd")
$null = $lines.Add("GRAPH_DATA_CHANGED: NO")
$null = $lines.Add("NEXUS_GRAPH_CODE_CHANGES: deduplicatedEdgeCount memo + toolbar/context wiring (edge dedup fix)")
$null = $lines.Add("ALL_HASHES_UNIQUE: $allUnique")
$null = $lines.Add("READY_FOR_COMMIT_REVIEW: $(if ($readyForReview) { 'YES' } else { 'NO - see FAIL above' })")
$null = $lines.Add("")

foreach ($r in $results) {
    $null = $lines.Add("--- $($r.PanelId) ---")
    $null = $lines.Add("ABSOLUTE_PATH: $($r.OutPath)")
    $null = $lines.Add("SHA256: $($r.LocalSHA256)")
    $null = $lines.Add("HASH_MATCH: $($r.HashesMatch)")
    $null = $lines.Add("FILE_SIZE_BYTES: $($r.FileSizeBytes)")
    $null = $lines.Add("SIGMA_NODES: $($r.SigmaNodes)")
    $null = $lines.Add("SIGMA_EDGES: $($r.SigmaEdges)")
    $null = $lines.Add("TOOLBAR_TEXT: $($r.ToolbarText)")
    $null = $lines.Add("TOOLBAR_EDGES: $($r.ToolbarEdges)")
    $null = $lines.Add("EDGES_MISMATCH: $($r.EdgesMismatch)")
    $null = $lines.Add("LARGE_TEXT_DOM: $($r.LargeTextDOM)")
    $null = $lines.Add("LARGE_TEXT_ARIA_PRESSED: $($r.LargeTextAria)")
    $null = $lines.Add("RESOLUTION_METHOD: $($r.ResolutionMethod)")
    $null = $lines.Add("RESOLVED_ID: $($r.ResolvedId)")
    $null = $lines.Add("CAPTURED_AT: $($r.CapturedAt)")
    $null = $lines.Add("EXPECTED: $($r.Expect)")
    $null = $lines.Add("")
}

$lines | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host ""
Write-Host "Manifest: $manifestPath"
Write-Host ""
Write-Host "=========================================="
Write-Host "BLOCKER_1_TOOLBAR_SIGMA_EDGES_MATCH: $(if ($b1_pass) { 'YES' } else { 'NO' })"
Write-Host "BLOCKER_2_LARGE_TEXT_ACTUALLY_ENABLED: $(if ($b2_pass) { 'YES' } else { 'NO' })"
Write-Host "BLOCKER_3_CANONICAL_ALIAS_PROVEN: NO"
Write-Host "BLOCKER_3_EXACT_NODE_ID_RESOLUTION: $(if ($b3_pass) { 'YES' } else { 'NO' })"
Write-Host "GRAPH_DATA_CHANGED: NO"
Write-Host "READY_FOR_COMMIT_REVIEW: $(if ($readyForReview) { 'YES' } else { 'NO' })"
Write-Host "=========================================="
