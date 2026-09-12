# ===========================================================================
# PASS-1.6 SELF-PROVING SERIAL CAPTURE SCRIPT
# ===========================================================================
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---- RUN ID ---------------------------------------------------------------
$ts = (Get-Date -Format "yyyyMMddHHmmss")
$rnd = -join ((65..90) + (97..122) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$RUN_ID = "run_${ts}_${rnd}"
$BASE_DIR = "S:\self-organizing-library\docs\graph\restoration-evidence\pass-1.6"
$RUN_DIR = Join-Path $BASE_DIR $RUN_ID

if (Test-Path $RUN_DIR) {
    Write-Error "ABORT: Run directory already exists: $RUN_DIR"
    exit 1
}
New-Item -ItemType Directory -Path $RUN_DIR | Out-Null
Write-Host "=== PASS-1.6 CAPTURE STARTED ===" 
Write-Host "RUN_ID: $RUN_ID"
Write-Host "RUN_DIR: $RUN_DIR"
Write-Host "STARTED: $(Get-Date -Format o)"

# ---- PLAYWRIGHT NODE HELPER -----------------------------------------------
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
"@

$helperContent | Out-File -FilePath $HELPER_PATH -Encoding UTF8
Write-Host "Helper written: $HELPER_PATH"

# ---- PANEL DEFINITIONS ----------------------------------------------------
# Data verified via API calls:
# navigation lens: 38 nodes, 2 EXECUTES edges (self-organizing-library repo only)
# authority lens: 59 nodes, 36 edges (CONTRADICTS x20, DEPENDS_ON x16)
#   Archivist-Agent: 40 nodes, papers: 19 nodes
#   CONFLICTED: 13 nodes (for ep:contradictions)
#   archivist-governance-spec -> 2abc406c3496acfd = ARCHIVISTINTERNALSTRUCTURE.md
$BASE_URL = "http://localhost:3000/graph"
$panels = @(
    [PSCustomObject]@{ Id="A10_default";       Url="${BASE_URL}?lens=navigation";                                                                WaitMs=3000; Expect="navigation lens, 38 nodes, 2 EXECUTES edges (structure+verification+execution active)" },
    [PSCustomObject]@{ Id="B10_cluster";       Url="${BASE_URL}?lens=authority&cluster=repo:Archivist-Agent";                                     WaitMs=3000; Expect="authority lens, Archivist-Agent cluster (40 nodes)" },
    [PSCustomObject]@{ Id="C10_focus";         Url="${BASE_URL}?lens=authority&selectedNode=node:archivist-governance-spec";                      WaitMs=4000; Expect="authority lens, focus on ARCHIVISTINTERNALSTRUCTURE.md + neighbors" },
    [PSCustomObject]@{ Id="D10_contradictions";Url="${BASE_URL}?lens=authority&entryPoint=ep:contradictions";                                     WaitMs=3000; Expect="authority lens, contradictions EP (13 CONFLICTED nodes)" },
    [PSCustomObject]@{ Id="E10_authority";     Url="${BASE_URL}?lens=authority&layers=structure,verification,governance,execution";               WaitMs=3000; Expect="authority lens, all layers active, overview density" },
    [PSCustomObject]@{ Id="F10_large_text";    Url="${BASE_URL}?lens=authority&density=focus";                                                    WaitMs=3500; Expect="authority lens, focus density (all 59 nodes)" }
)

# ---- SERIAL CAPTURE -------------------------------------------------------
$results = [System.Collections.ArrayList]::new()

foreach ($panel in $panels) {
    $outPath = Join-Path $RUN_DIR "$($panel.Id).png"
    
    Write-Host ""
    Write-Host "=== CAPTURING: $($panel.Id) ==="
    Write-Host "URL: $($panel.Url)"
    Write-Host "Expected: $($panel.Expect)"

    if (Test-Path $outPath) {
        Write-Error "ABORT: File already exists (no reuse allowed): $outPath"
        exit 1
    }

    $nodeOut = node $HELPER_PATH $panel.Id $panel.Url $outPath $panel.WaitMs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "CAPTURE FAILED (exit $LASTEXITCODE):"
        Write-Host ($nodeOut -join "`n")
        exit 1
    }

    # Parse RESULT_JSON line
    $resultLine = $nodeOut | Where-Object { $_ -match '^RESULT_JSON:' } | Select-Object -Last 1
    $parsed = $null
    if ($resultLine) {
        $jsonStr = $resultLine -replace '^RESULT_JSON:', ''
        try { $parsed = $jsonStr | ConvertFrom-Json } catch { Write-Host "WARNING: JSON parse error: $_" }
    }

    # Independent hash verification
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

    $r = [PSCustomObject]@{
        PanelId        = $panel.Id
        Url            = $panel.Url
        OutPath        = $outPath
        LocalSHA256    = $localHash
        NodeHash       = $nodeHash
        HashesMatch    = $hashMatch
        FileSizeBytes  = $fileBytes.Length
        SigmaNodes     = if ($parsed) { $parsed.graphState.renderedNodes } else { -99 }
        SigmaEdges     = if ($parsed) { $parsed.graphState.renderedEdges } else { -99 }
        ToolbarText    = if ($parsed) { $parsed.toolbarText } else { "UNKNOWN" }
        SelectedCluster= if ($parsed) { $parsed.graphState.activeClusterId } else { "UNKNOWN" }
        SelectedNode   = if ($parsed) { $parsed.graphState.selectedNodeId } else { "UNKNOWN" }
        ResolvedNodeId = if ($parsed) { $parsed.graphState.resolvedNodeId } else { "UNKNOWN" }
        ResolvedTitle  = if ($parsed) { $parsed.graphState.resolvedNodeTitle } else { "UNKNOWN" }
        Resolution     = if ($parsed) { $parsed.graphState.resolutionMethod } else { "UNKNOWN" }
        ActiveEP       = if ($parsed) { $parsed.graphState.activeEntryPoint } else { "UNKNOWN" }
        ActiveLayers   = if ($parsed) { ($parsed.graphState.activeLayers -join ",") } else { "UNKNOWN" }
        CapturedAt     = if ($parsed) { $parsed.capturedAt } else { (Get-Date -Format o) }
        Expect         = $panel.Expect
    }

    Write-Host "  LocalSHA256:  $localHash"
    Write-Host "  NodeSHA256:   $nodeHash"
    Write-Host "  HashesMatch:  $hashMatch"
    Write-Host "  SigmaNodes:   $($r.SigmaNodes)"
    Write-Host "  SigmaEdges:   $($r.SigmaEdges)"
    Write-Host "  ToolbarText:  $($r.ToolbarText)"
    Write-Host "  Resolution:   $($r.Resolution) -> $($r.ResolvedNodeId)"
    Write-Host "  Layers:       $($r.ActiveLayers)"
    Write-Host "  FileSize:     $($fileBytes.Length) bytes"

    $null = $results.Add($r)
}

Write-Host ""
Write-Host "=== ALL PANELS CAPTURED ==="

# ---- HASH UNIQUENESS CHECK -----------------------------------------------
$allHashes = @($results | ForEach-Object { $_.LocalSHA256 })
$uniqueCount = ($allHashes | Sort-Object -Unique).Count
$allUnique = ($uniqueCount -eq $allHashes.Count)
Write-Host "Hash uniqueness: $uniqueCount unique of $($allHashes.Count) total  ->  $(if ($allUnique) { 'ALL UNIQUE OK' } else { 'DUPLICATES DETECTED - FAIL' })"

# ---- WRITE MANIFEST -------------------------------------------------------
$manifestPath = Join-Path $RUN_DIR "FINAL-MANIFEST.txt"
$lines = [System.Collections.ArrayList]::new()
$null = $lines.Add("=== PASS-1.6 FINAL MANIFEST ===")
$null = $lines.Add("RUN_ID: $RUN_ID")
$null = $lines.Add("CREATED_AT: $(Get-Date -Format o)")
$null = $lines.Add("ALL_HASHES_UNIQUE: $allUnique")
$null = $lines.Add("TARGET_DIR: $RUN_DIR")
$null = $lines.Add("")

foreach ($r in $results) {
    $null = $lines.Add("--- $($r.PanelId) ---")
    $null = $lines.Add("ABSOLUTE_PATH: $($r.OutPath)")
    $null = $lines.Add("SHA256: $($r.LocalSHA256)")
    $null = $lines.Add("HASH_MATCH: $($r.HashesMatch)")
    $null = $lines.Add("FILE_SIZE_BYTES: $($r.FileSizeBytes)")
    $null = $lines.Add("TOOLBAR_TEXT: $($r.ToolbarText)")
    $null = $lines.Add("SIGMA_NODES: $($r.SigmaNodes)")
    $null = $lines.Add("SIGMA_EDGES: $($r.SigmaEdges)")
    $null = $lines.Add("SELECTED_CLUSTER: $($r.SelectedCluster)")
    $null = $lines.Add("SELECTED_NODE: $($r.SelectedNode)")
    $null = $lines.Add("RESOLVED_NODE_ID: $($r.ResolvedNodeId)")
    $null = $lines.Add("RESOLVED_TITLE: $($r.ResolvedTitle)")
    $null = $lines.Add("RESOLUTION_METHOD: $($r.Resolution)")
    $null = $lines.Add("ACTIVE_ENTRY_POINT: $($r.ActiveEP)")
    $null = $lines.Add("ACTIVE_LAYERS: $($r.ActiveLayers)")
    $null = $lines.Add("CAPTURED_AT: $($r.CapturedAt)")
    $null = $lines.Add("EXPECTED: $($r.Expect)")
    $null = $lines.Add("")
}

$lines | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "Manifest written: $manifestPath"

# ---- FINAL SUMMARY --------------------------------------------------------
Write-Host ""
Write-Host "=========================================="
Write-Host "PASS-1.6 CAPTURE COMPLETE"
Write-Host "RUN_ID: $RUN_ID"
Write-Host "RUN_DIR: $RUN_DIR"
Write-Host "ALL_HASHES_UNIQUE: $allUnique"
Write-Host "=========================================="
Write-Host ""
Write-Host "PANEL SUMMARY:"
foreach ($r in $results) {
    $hashOk = if ($r.HashesMatch) { "HASH_OK" } else { "HASH_MISMATCH" }
    $resolveOk = if ($r.Resolution -eq "UNRESOLVED" -and $r.SelectedNode -ne "null") { " [UNRESOLVED_NODE]" } else { "" }
    Write-Host "  $($r.PanelId): $($r.SigmaNodes)n/$($r.SigmaEdges)e  [$hashOk]$resolveOk  layers=[$($r.ActiveLayers)]"
}
Write-Host ""
