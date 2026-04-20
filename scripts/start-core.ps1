# FREEAGENT Production Phenotype - Library Lane Core Startup
# Phase 2: Boot Path Unification
# Owner: Archivist (implementation)

param(
    [switch]$SkipHealthCheck,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# ==============================================================================
# CONFIGURATION
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogsDir = Join-Path $ProjectRoot "logs"
$TrustDir = Join-Path $ProjectRoot ".trust"

# Environment defaults
$EnvDefaults = @{
    LANE_ID = "library"
    LANE_KEY_PATH = Join-Path $TrustDir "library.json"
    ARCHIVIST_TRUST_STORE_PATH = "S:\Archivist-Agent\.trust\keys.json"
    ARCHIVIST_ORCHESTRATOR_URL = "http://localhost:3000/orchestrate/recovery"
}

# ==============================================================================
# LOGGING
# ==============================================================================

function Write-Log {
    param([string]$Level, [string]$Message)
    
    $timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to console
    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        "INFO"  { Write-Host $logEntry -ForegroundColor Cyan }
        "DEBUG" { if ($Verbose) { Write-Host $logEntry -ForegroundColor Gray } }
        default { Write-Host $logEntry }
    }
    
    # Write to log file
    $LogFile = Join-Path $LogsDir "startup.log"
    if (-not (Test-Path $LogsDir)) {
        New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null
    }
    Add-Content -Path $LogFile -Value $logEntry
}

# ==============================================================================
# PRE-FLIGHT CHECKS
# ==============================================================================

function Test-EnvironmentVariables {
    Write-Log "INFO" "Checking environment variables..."
    
    $issues = @()
    
    # Required: LANE_KEY_PASSPHRASE
    if (-not $env:LANE_KEY_PASSPHRASE) {
        $issues += "LANE_KEY_PASSPHRASE is not set (REQUIRED)"
        Write-Log "ERROR" "LANE_KEY_PASSPHRASE is not set"
    } else {
        Write-Log "DEBUG" "LANE_KEY_PASSPHRASE is set (length: $($env:LANE_KEY_PASSPHRASE.Length))"
    }
    
    # Set defaults for optional variables
    foreach ($key in $EnvDefaults.Keys) {
        if (-not (Get-Item "env:$key" -ErrorAction SilentlyContinue)) {
            Set-Item "env:$key" $EnvDefaults[$key]
            Write-Log "DEBUG" "Set default $key = $($EnvDefaults[$key])"
        } else {
            Write-Log "DEBUG" "$key = $(Get-Item "env:$key")"
        }
    }
    
    return $issues.Count -eq 0
}

function Test-TrustStore {
    Write-Log "INFO" "Checking trust store..."
    
    $trustStorePath = $env:ARCHIVIST_TRUST_STORE_PATH
    
    if (-not (Test-Path $trustStorePath)) {
        Write-Log "ERROR" "Trust store not found: $trustStorePath"
        return $false
    }
    
    try {
        $trustStore = Get-Content $trustStorePath -Raw | ConvertFrom-Json
        
        # Check for required lanes
        $requiredLanes = @("swarmmind", "library", "archivist")
        $missingLanes = @()
        
        foreach ($lane in $requiredLanes) {
            if (-not $trustStore.keys.$lane) {
                $missingLanes += $lane
            } elseif ($trustStore.keys.$lane.status -eq "revoked") {
                Write-Log "WARN" "Lane '$lane' key is REVOKED"
                $missingLanes += $lane
            }
        }
        
        if ($missingLanes.Count -gt 0) {
            Write-Log "ERROR" "Missing or revoked lanes: $($missingLanes -join ', ')"
            return $false
        }
        
        Write-Log "INFO" "Trust store OK - $($requiredLanes.Count) lanes registered"
        return $true
        
    } catch {
        Write-Log "ERROR" "Failed to parse trust store: $_"
        return $false
    }
}

function Test-LaneKeyPair {
    Write-Log "INFO" "Checking lane key pair..."
    
    $keyPath = $env:LANE_KEY_PATH
    
    if (-not (Test-Path $keyPath)) {
        Write-Log "ERROR" "Lane key pair not found: $keyPath"
        return $false
    }
    
    try {
        $keyFile = Get-Content $keyPath -Raw | ConvertFrom-Json
        
        # Check required fields
        if (-not $keyFile.private_key) {
            Write-Log "ERROR" "Key file missing private_key"
            return $false
        }
        if (-not $keyFile.public_key) {
            Write-Log "ERROR" "Key file missing public_key"
            return $false
        }
        if (-not $keyFile.key_id) {
            Write-Log "WARN" "Key file missing key_id (using default)"
        }
        
        Write-Log "INFO" "Lane key pair OK - key_id: $($keyFile.key_id)"
        return $true
        
    } catch {
        Write-Log "ERROR" "Failed to parse key file: $_"
        return $false
    }
}

function Test-KeyDecryption {
    Write-Log "INFO" "Testing key decryption..."
    
    # Use Node.js to test decryption
    $testScript = @"
const KeyManager = require('../src/attestation/KeyManager');
const path = require('path');

async function test() {
    try {
        const km = new KeyManager({ keyPath: process.env.LANE_KEY_PATH });
        await km.loadPrivateKey(process.env.LANE_KEY_PASSPHRASE);
        console.log(JSON.stringify({ success: true, keyId: km.getKeyId() }));
    } catch (err) {
        console.log(JSON.stringify({ success: false, error: err.message }));
        process.exit(1);
    }
}
test();
"@
    
    $tempFile = Join-Path $env:TEMP "test-decrypt-$(Get-Random).js"
    $testScript | Out-File -FilePath $tempFile -Encoding utf8
    
    try {
        $result = node $tempFile 2>&1
        $parsed = $result | ConvertFrom-Json
        
        if ($parsed.success) {
            Write-Log "INFO" "Key decryption OK - keyId: $($parsed.keyId)"
            return $true
        } else {
            Write-Log "ERROR" "Key decryption failed: $($parsed.error)"
            return $false
        }
    } catch {
        Write-Log "ERROR" "Key decryption test failed: $_"
        return $false
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}

# ==============================================================================
# STARTUP SEQUENCE
# ==============================================================================

function Start-Core {
    Write-Log "INFO" "=========================================="
    Write-Log "INFO" "FREEAGENT Library Lane Core Startup"
    Write-Log "INFO" "Phase 2: Boot Path Unification"
    Write-Log "INFO" "=========================================="
    
    $allChecksPassed = $true
    
    # Step 1: Environment Variables
    if (-not (Test-EnvironmentVariables)) {
        Write-Log "ERROR" "Environment variable check FAILED"
        $allChecksPassed = $false
    }
    
    # Step 2: Trust Store
    if (-not (Test-TrustStore)) {
        Write-Log "ERROR" "Trust store check FAILED"
        $allChecksPassed = $false
    }
    
    # Step 3: Lane Key Pair
    if (-not (Test-LaneKeyPair)) {
        Write-Log "ERROR" "Lane key pair check FAILED"
        $allChecksPassed = $false
    }
    
    # Step 4: Key Decryption (only if passphrase is set)
    if ($env:LANE_KEY_PASSPHRASE) {
        if (-not (Test-KeyDecryption)) {
            Write-Log "ERROR" "Key decryption check FAILED"
            $allChecksPassed = $false
        }
    }
    
    # Step 5: Health Check (unless skipped)
    if (-not $SkipHealthCheck) {
        Write-Log "INFO" "Running health check..."
        $healthScript = Join-Path $ScriptDir "health-core.ps1"
        if (Test-Path $healthScript) {
            & $healthScript
            if ($LASTEXITCODE -ne 0) {
                Write-Log "ERROR" "Health check FAILED"
                $allChecksPassed = $false
            }
        } else {
            Write-Log "WARN" "Health check script not found, skipping"
        }
    }
    
    # Final Status
    Write-Log "INFO" "=========================================="
    if ($allChecksPassed) {
        Write-Log "INFO" "STARTUP COMPLETE - All checks passed"
        Write-Log "INFO" "=========================================="
        
        # Output structured status
        $status = @{
            status = "healthy"
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK")
            lane = $env:LANE_ID
            checks = @{
                environment = $true
                trustStore = $true
                keyPair = $true
                decryption = $true
            }
        }
        Write-Output ($status | ConvertTo-Json -Compress)
        exit 0
    } else {
        Write-Log "ERROR" "STARTUP FAILED - See errors above"
        Write-Log "ERROR" "=========================================="
        
        $status = @{
            status = "unhealthy"
            timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK")
            lane = $env:LANE_ID
            checks = @{
                environment = (Test-EnvironmentVariables)
                trustStore = (Test-TrustStore)
                keyPair = (Test-LaneKeyPair)
                decryption = $false
            }
        }
        Write-Output ($status | ConvertTo-Json -Compress)
        exit 1
    }
}

# ==============================================================================
# MAIN
# ==============================================================================

Start-Core
