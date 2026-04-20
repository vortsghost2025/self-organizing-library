# FREEAGENT Production Phenotype - Library Lane Health Check
# Phase 2: Boot Path Unification
# Owner: Archivist (implementation)

param(
    [switch]$Json,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# ==============================================================================
# CONFIGURATION
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogsDir = Join-Path $ProjectRoot "logs"
$TrustDir = Join-Path $ProjectRoot ".trust"

# ==============================================================================
# LOGGING
# ==============================================================================

function Write-Log {
    param([string]$Level, [string]$Message)
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if (-not $Json) {
        switch ($Level) {
            "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
            "INFO"  { Write-Host $logEntry -ForegroundColor Cyan }
            "DEBUG" { if ($Verbose) { Write-Host $logEntry -ForegroundColor Gray } }
            default { Write-Host $logEntry }
        }
    }
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

function Get-TrustStoreHealth {
    $result = @{
        status = "unknown"
        path = $env:ARCHIVIST_TRUST_STORE_PATH
        lanes = @()
        active = 0
        revoked = 0
    }
    
    try {
        $path = $env:ARCHIVIST_TRUST_STORE_PATH
        if (-not $path) {
            $path = "S:\Archivist-Agent\.trust\keys.json"
        }
        
        if (-not (Test-Path $path)) {
            $result.status = "missing"
            $result.error = "Trust store file not found"
            return $result
        }
        
        $trustStore = Get-Content $path -Raw | ConvertFrom-Json
        $result.lanes = @($trustStore.keys.PSObject.Properties.Name)
        
        foreach ($lane in $result.lanes) {
            if ($trustStore.keys.$lane.status -eq "active") {
                $result.active++
            } elseif ($trustStore.keys.$lane.status -eq "revoked") {
                $result.revoked++
            }
        }
        
        $result.status = "ok"
        
    } catch {
        $result.status = "error"
        $result.error = $_.Exception.Message
    }
    
    return $result
}

function Get-KeyPairHealth {
    $result = @{
        status = "unknown"
        path = $env:LANE_KEY_PATH
        keyId = $null
        algorithm = "RSA-2048"
    }
    
    try {
        $path = $env:LANE_KEY_PATH
        if (-not $path) {
            $path = Join-Path $TrustDir "library.json"
        }
        
        if (-not (Test-Path $path)) {
            $result.status = "missing"
            $result.error = "Key pair file not found"
            return $result
        }
        
        $keyFile = Get-Content $path -Raw | ConvertFrom-Json
        
        if (-not $keyFile.private_key) {
            $result.status = "invalid"
            $result.error = "Missing private_key"
            return $result
        }
        
        if (-not $keyFile.public_key) {
            $result.status = "invalid"
            $result.error = "Missing public_key"
            return $result
        }
        
        $result.keyId = $keyFile.key_id
        $result.status = "ok"
        
    } catch {
        $result.status = "error"
        $result.error = $_.Exception.Message
    }
    
    return $result
}

function Get-VerificationHealth {
    $result = @{
        status = "unknown"
        lastTest = $null
    }
    
    try {
        # Run lane consistency test
        $testScript = Join-Path $ScriptDir "test-lane-consistency.js"
        
        if (-not (Test-Path $testScript)) {
            $result.status = "missing"
            $result.error = "test-lane-consistency.js not found"
            return $result
        }
        
        $output = node $testScript 2>&1
        $lastExitCode = $LASTEXITCODE
        
        $result.lastTest = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK")
        
        if ($lastExitCode -eq 0) {
            $result.status = "ok"
            $result.output = $output
        } else {
            $result.status = "failed"
            $result.error = "Verification test failed"
            $result.output = $output
        }
        
    } catch {
        $result.status = "error"
        $result.error = $_.Exception.Message
    }
    
    return $result
}

function Get-EnvironmentHealth {
    $result = @{
        status = "unknown"
        variables = @{}
    }
    
    $requiredVars = @(
        "LANE_KEY_PASSPHRASE",
        "LANE_ID",
        "LANE_KEY_PATH",
        "ARCHIVIST_TRUST_STORE_PATH",
        "ARCHIVIST_ORCHESTRATOR_URL"
    )
    
    $missing = @()
    
    foreach ($var in $requiredVars) {
        $value = Get-Item "env:$var" -ErrorAction SilentlyContinue
        if ($value) {
            if ($var -eq "LANE_KEY_PASSPHRASE") {
                $result.variables[$var] = "***SET***"
            } else {
                $result.variables[$var] = $value.Value
            }
        } else {
            $result.variables[$var] = "***NOT SET***"
            if ($var -eq "LANE_KEY_PASSPHRASE") {
                $missing += $var
            }
        }
    }
    
    if ($missing.Count -gt 0) {
        $result.status = "missing_required"
        $result.error = "Missing required: $($missing -join ', ')"
    } else {
        $result.status = "ok"
    }
    
    return $result
}

function Get-FilesystemHealth {
    $result = @{
        status = "unknown"
        directories = @{}
        logs = $null
    }
    
    # Check logs directory
    $logsPath = Join-Path $ProjectRoot "logs"
    if (Test-Path $logsPath) {
        $result.directories["logs"] = "exists"
        $result.logs = $logsPath
    } else {
        # Try to create
        try {
            New-Item -ItemType Directory -Path $logsPath -Force | Out-Null
            $result.directories["logs"] = "created"
            $result.logs = $logsPath
        } catch {
            $result.directories["logs"] = "missing"
        }
    }
    
    # Check trust directory
    $trustPath = Join-Path $ProjectRoot ".trust"
    if (Test-Path $trustPath) {
        $result.directories["trust"] = "exists"
    } else {
        $result.directories["trust"] = "missing"
    }
    
    # Overall status
    if ($result.directories["logs"] -eq "missing" -or $result.directories["trust"] -eq "missing") {
        $result.status = "degraded"
    } else {
        $result.status = "ok"
    }
    
    return $result
}

# ==============================================================================
# MAIN
# ==============================================================================

function Get-HealthStatus {
    Write-Log "INFO" "Running Library Lane health checks..."
    
    $checks = @{
        trustStore = Get-TrustStoreHealth
        keyPair = Get-KeyPairHealth
        verification = Get-VerificationHealth
        environment = Get-EnvironmentHealth
        filesystem = Get-FilesystemHealth
    }
    
    # Determine overall status
    $allOk = $true
    $anyDegraded = $false
    
    foreach ($key in $checks.Keys) {
        if ($checks[$key].status -ne "ok") {
            $allOk = $false
            if ($checks[$key].status -eq "degraded") {
                $anyDegraded = $true
            }
        }
    }
    
    $status = @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK")
        lane = if ($env:LANE_ID) { $env:LANE_ID } else { "library" }
        status = if ($allOk) { "healthy" } elseif ($anyDegraded) { "degraded" } else { "unhealthy" }
        checks = $checks
    }
    
    return $status
}

# ==============================================================================
# OUTPUT
# ==============================================================================

$healthStatus = Get-HealthStatus

if ($Json) {
    Write-Output ($healthStatus | ConvertTo-Json -Depth 10)
} else {
    Write-Host ""
    Write-Host "=== Library Lane Health Status ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $($healthStatus.timestamp)"
    Write-Host "Lane: $($healthStatus.lane)"
    Write-Host "Overall: $($healthStatus.status)" -ForegroundColor $(if ($healthStatus.status -eq "healthy") { "Green" } elseif ($healthStatus.status -eq "degraded") { "Yellow" } else { "Red" })
    Write-Host ""
    
    foreach ($check in $healthStatus.checks.Keys) {
        $checkStatus = $healthStatus.checks[$check].status
        $color = if ($checkStatus -eq "ok") { "Green" } elseif ($checkStatus -eq "degraded") { "Yellow" } else { "Red" }
        Write-Host "  [$checkStatus] $check" -ForegroundColor $color
    }
    
    Write-Host ""
}

# Exit code based on status
if ($healthStatus.status -eq "healthy") {
    exit 0
} elseif ($healthStatus.status -eq "degraded") {
    exit 0  # Degraded is still acceptable
} else {
    exit 1
}
