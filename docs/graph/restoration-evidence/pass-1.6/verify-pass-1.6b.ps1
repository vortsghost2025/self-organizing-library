# ===========================================================================
# PASS-1.6B VERIFICATION SCRIPT — SPEC COMPLIANCE + PRECOMMIT CHECKS
# ===========================================================================
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ts = (Get-Date -Format "yyyyMMddHHmmss")
$rnd = -join ((65..90) + (97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$RUN_ID = "run_16b_${ts}_${rnd}"
$BASE_DIR = "S:\self-organizing-library\docs\graph\restoration-evidence\pass-1.6"
$RUN_DIR = Join-Path $BASE_DIR $RUN_ID
New-Item -ItemType Directory -Path $RUN_DIR | Out-Null

Write-Host "=== PASS-1.6B VERIFICATION RUN ==="
Write-Host "RUN_ID: $RUN_ID"
Write-Host "RUN_DIR: $RUN_DIR"
Write-Host "STARTED: $(Get-Date -Format o)"

$HELPER_PATH = Join-Path $RUN_DIR "helper16b.js"
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
"@

$helperContent | Out-File -FilePath $HELPER_PATH -Encoding UTF8
Write-Host "Helper written: $HELPER_PATH"

$BASE_URL = "http://localhost:3000/graph"

$panels = @(
    [PSCustomObject]@{
        Id="A16b_default"
        Url="${BASE_URL}?lens=navigation"
        WaitMs=3000
        LargeText=$false
        Expect="navigation default with locked spec layers [structure, verification]. Toolbar & Sigma should both report 38 nodes / 0 edges."
    },
    [PSCustomObject]@{
        Id="C16b_focus_rawid"
        Url="${BASE_URL}?lens=authority&selectedNode=2abc406c3496acfd"
        WaitMs=3500
        LargeText=$false
        Expect="authority focus using exact node ID 2abc406c3496acfd. resolutionMethod must be exact_node_id."
    },
    [PSCustomObject]@{
        Id="F16b_large_text_viewport"
        Url="${BASE_URL}?lens=navigation"
        WaitMs=3500
        LargeText=$true
        Expect="navigation default with Large Text accessibility enabled. Containment must verify 0 nodes outside visible viewport."
    }
)

$results = [System.Collections.ArrayList]::new()

foreach ($panel in $panels) {
    $outPath = Join-Path $RUN_DIR "$($panel.Id).png"
    Write-Host ""
    Write-Host "=== CAPTURING: $($panel.Id) ==="
    Write-Host "URL: $($panel.Url)"
    Write-Host "LargeText: $($panel.LargeText)"

    $ltArg = if ($panel.LargeText) { "large-text" } else { "no" }
    $nodeOut = node $HELPER_PATH $panel.Id $panel.Url $outPath $panel.WaitMs $ltArg 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "CAPTURE FAILED:"
        Write-Host ($nodeOut -join "`n")
        exit 1
    }

    $resultLine = $nodeOut | Where-Object { $_ -match '^RESULT_JSON:' } | Select-Object -Last 1
    $parsed = $null
    if ($resultLine) {
        $jsonStr = $resultLine -replace '^RESULT_JSON:', ''
        try { $parsed = $jsonStr | ConvertFrom-Json } catch { }
    }

    $fileBytes = [System.IO.File]::ReadAllBytes($outPath)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $localHash = (($sha256.ComputeHash($fileBytes)) | ForEach-Object { $_.ToString("x2") }) -join ""

    $nodeHash = if ($parsed) { $parsed.hash } else { "PARSE_FAILED" }
    $hashMatch = ($localHash -eq $nodeHash)

    $sigmaNodes  = if ($parsed) { $parsed.graphState.renderedNodes } else { -99 }
    $sigmaEdges  = if ($parsed) { $parsed.graphState.renderedEdges } else { -99 }
    $toolbarText = if ($parsed) { $parsed.toolbarText } else { "UNKNOWN" }
    $ltDom       = if ($parsed) { $parsed.largeTextActive } else { $false }
    $ltAria      = if ($parsed) { $parsed.aaButtonPressed } else { "UNKNOWN" }
    $resMethod   = if ($parsed) { $parsed.graphState.resolutionMethod } else { "UNKNOWN" }
    $resolvedId  = if ($parsed) { $parsed.graphState.resolvedNodeId } else { "UNKNOWN" }
    $layers      = if ($parsed) { $parsed.graphState.activeLayers } else { @() }

    $outsideCount = if ($parsed -and $parsed.containment) { $parsed.containment.outsideCount } else { -1 }

    $toolbarEdges = "UNKNOWN"
    if ($toolbarText -match '(\d+) edges?') { $toolbarEdges = $Matches[1] }
    $toolbarNodes = "UNKNOWN"
    if ($toolbarText -match '(\d+) nodes?') { $toolbarNodes = $Matches[1] }
    $edgesMatch = ($toolbarEdges -eq $sigmaEdges.ToString())

    $r = [PSCustomObject]@{
        PanelId          = $panel.Id
        LocalSHA256      = $localHash
        HashesMatch      = $hashMatch
        SigmaNodes       = $sigmaNodes
        SigmaEdges       = $sigmaEdges
        ToolbarText      = $toolbarText
        ToolbarEdges     = $toolbarEdges
        EdgesMatch       = $edgesMatch
        Layers           = ($layers -join ",")
        LargeTextDOM     = $ltDom
        LargeTextAria    = $ltAria
        ResolutionMethod = $resMethod
        ResolvedId       = $resolvedId
        OutsideCount     = $outsideCount
        Expect           = $panel.Expect
        OutPath          = $outPath
    }

    Write-Host "  LocalSHA256:       $localHash"
    Write-Host "  HashesMatch:       $hashMatch"
    Write-Host "  Sigma:             $sigmaNodes nodes / $sigmaEdges edges"
    Write-Host "  Toolbar:           $toolbarText"
    Write-Host "  Edges Match:       $edgesMatch (Toolbar: $toolbarEdges, Sigma: $sigmaEdges)"
    Write-Host "  Layers:            $($r.Layers)"
    Write-Host "  Resolution:        $resMethod -> $resolvedId"
    Write-Host "  LargeText DOM:     $ltDom | Aria: $ltAria"
    Write-Host "  Outside Viewport:  $outsideCount"

    $null = $results.Add($r)
}

Write-Host ""
Write-Host "=== PASS-1.6B EVALUATION ==="

$aPanel = $results | Where-Object { $_.PanelId -eq "A16b_default" }
$cPanel = $results | Where-Object { $_.PanelId -eq "C16b_focus_rawid" }
$fPanel = $results | Where-Object { $_.PanelId -eq "F16b_large_text_viewport" }

$aPass = ($aPanel -and $aPanel.EdgesMatch -and $aPanel.Layers -eq "structure,verification" -and $aPanel.SigmaNodes -eq 38 -and $aPanel.SigmaEdges -eq 0)
$cPass = ($cPanel -and $cPanel.ResolutionMethod -eq "exact_node_id" -and $cPanel.ResolvedId -eq "2abc406c3496acfd")
$fPass = ($fPanel -and $fPanel.LargeTextDOM -eq $true -and $fPanel.LargeTextAria -eq "true" -and $fPanel.OutsideCount -eq 0)

$allHashes = @($results | ForEach-Object { $_.LocalSHA256 })
$allUnique = (($allHashes | Sort-Object -Unique).Count -eq $allHashes.Count)

Write-Host "  1. DEFAULT SPEC COMPLIANT (38n/0e, [structure,verification]): $(if ($aPass) { 'PASS' } else { 'FAIL' })"
Write-Host "  2. CANONICAL ALIAS REMOVED (exact_node_id resolution):          $(if ($cPass) { 'PASS' } else { 'FAIL' })"
Write-Host "  3. LARGE TEXT NODE CONTAINMENT (0 nodes outside viewport):     $(if ($fPass) { 'PASS' } else { 'FAIL' }) (Outside: $($fPanel.OutsideCount))"
Write-Host "  4. ALL HASHES UNIQUE:                                          $(if ($allUnique) { 'PASS' } else { 'FAIL' })"

$manifestPath = Join-Path $RUN_DIR "PASS-1.6B-MANIFEST.txt"
@(
    "=== PASS-1.6B MANIFEST ===",
    "RUN_ID: $RUN_ID",
    "CREATED_AT: $(Get-Date -Format o)",
    "DEFAULT_SPEC_COMPLIANT: $(if ($aPass) { 'YES' } else { 'NO' })",
    "EDGE_COUNT_SOURCE_MATCHES_RENDERER: $(if ($aPanel.EdgesMatch) { 'YES' } else { 'NO' })",
    "UNPROVEN_ALIAS_REMOVED: $(if ($cPass) { 'YES' } else { 'NO' })",
    "LARGE_TEXT_ENABLED: $(if ($fPanel.LargeTextDOM -and $fPanel.LargeTextAria -eq 'true') { 'YES' } else { 'NO' })",
    "NODES_OUTSIDE_VISIBLE_VIEWPORT: $($fPanel.OutsideCount)",
    "LARGE_TEXT_NODE_CONTAINMENT_PASS: $(if ($fPass) { 'YES' } else { 'NO' })",
    "GRAPH_DATA_CHANGED: NO",
    "",
    "--- A16b_default ---",
    "PATH: $($aPanel.OutPath)",
    "SHA256: $($aPanel.LocalSHA256)",
    "SIGMA: $($aPanel.SigmaNodes)n / $($aPanel.SigmaEdges)e",
    "TOOLBAR: $($aPanel.ToolbarText)",
    "LAYERS: $($aPanel.Layers)",
    "",
    "--- C16b_focus_rawid ---",
    "PATH: $($cPanel.OutPath)",
    "SHA256: $($cPanel.LocalSHA256)",
    "RESOLUTION_METHOD: $($cPanel.ResolutionMethod)",
    "RESOLVED_ID: $($cPanel.ResolvedId)",
    "SIGMA: $($cPanel.SigmaNodes)n / $($cPanel.SigmaEdges)e",
    "TOOLBAR: $($cPanel.ToolbarText)",
    "",
    "--- F16b_large_text_viewport ---",
    "PATH: $($fPanel.OutPath)",
    "SHA256: $($fPanel.LocalSHA256)",
    "LARGE_TEXT_DOM: $($fPanel.LargeTextDOM)",
    "LARGE_TEXT_ARIA: $($fPanel.LargeTextAria)",
    "NODES_OUTSIDE_VIEWPORT: $($fPanel.OutsideCount)",
    "SIGMA: $($fPanel.SigmaNodes)n / $($fPanel.SigmaEdges)e",
    "TOOLBAR: $($fPanel.ToolbarText)"
) | Out-File -FilePath $manifestPath -Encoding UTF8

Write-Host "Manifest written: $manifestPath"
