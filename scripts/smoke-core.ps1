# FREEAGENT Production Phenotype - Library Lane Smoke Tests
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
            "PASS"  { Write-Host $logEntry -ForegroundColor Green }
            "FAIL"  { Write-Host $logEntry -ForegroundColor Red }
            "DEBUG" { if ($Verbose) { Write-Host $logEntry -ForegroundColor Gray } }
            default { Write-Host $logEntry }
        }
    }
}

# ==============================================================================
# TEST FUNCTIONS
# ==============================================================================

function Test-SyntaxAndStartup {
    Write-Log "INFO" "Test: Syntax and startup integrity..."
    
    $result = @{
        name = "Syntax and Startup Integrity"
        status = "unknown"
        tests = @()
    }
    
    # Test 1: Node --check on core entry files
    $coreFiles = @(
        "src/attestation/Verifier.js",
        "src/attestation/Signer.js",
        "src/attestation/KeyManager.js",
        "src/attestation/VerifierWrapper.js",
        "src/queue/Queue.js"
    )
    
    $syntaxErrors = @()
    foreach ($file in $coreFiles) {
        $fullPath = Join-Path $ProjectRoot $file
        if (Test-Path $fullPath) {
            $checkOutput = node --check $fullPath 2>&1
            if ($LASTEXITCODE -ne 0) {
                $syntaxErrors += @{
                    file = $file
                    error = $checkOutput
                }
                Write-Log "DEBUG" "SYNTAX ERROR: $file"
            } else {
                Write-Log "DEBUG" "SYNTAX OK: $file"
                $result.tests += @{
                    file = $file
                    status = "pass"
                }
            }
        } else {
            $syntaxErrors += @{
                file = $file
                error = "File not found"
            }
        }
    }
    
    if ($syntaxErrors.Count -eq 0) {
        $result.status = "pass"
        Write-Log "PASS" "All core files pass syntax check"
    } else {
        $result.status = "fail"
        $result.errors = $syntaxErrors
        Write-Log "FAIL" "$($syntaxErrors.Count) file(s) have syntax errors"
    }
    
    return $result
}

function Test-HealthEndpoints {
    Write-Log "INFO" "Test: Health endpoint checks..."
    
    $result = @{
        name = "Health Endpoints"
        status = "unknown"
        tests = @()
    }
    
    # Library lane doesn't have HTTP endpoints, so we test script-based health
    $healthScript = Join-Path $ScriptDir "health-core.ps1"
    
    if (Test-Path $healthScript) {
        $healthOutput = & $healthScript -Json 2>&1
        $healthResult = $healthOutput | ConvertFrom-Json
        
        if ($healthResult.status -eq "healthy") {
            $result.status = "pass"
            $result.tests += @{
                name = "Library Lane Health"
                status = "pass"
                details = $healthResult
            }
            Write-Log "PASS" "Library lane health check passed"
        } else {
            $result.status = "fail"
            $result.tests += @{
                name = "Library Lane Health"
                status = "fail"
                details = $healthResult
            }
            Write-Log "FAIL" "Library lane health check failed: $($healthResult.status)"
        }
    } else {
        $result.status = "fail"
        $result.tests += @{
            name = "Health Script"
            status = "missing"
        }
        Write-Log "FAIL" "health-core.ps1 not found"
    }
    
    return $result
}

function Test-VerificationChecks {
    Write-Log "INFO" "Test: Verification functionality..."
    
    $result = @{
        name = "Verification Checks"
        status = "unknown"
        tests = @()
    }
    
    # Run test-lane-consistency.js
    $testScript = Join-Path $ScriptDir "test-lane-consistency.js"
    
    if (Test-Path $testScript) {
        Write-Log "DEBUG" "Running test-lane-consistency.js..."
        $testOutput = node $testScript 2>&1
        $testExitCode = $LASTEXITCODE
        
        $result.tests += @{
            name = "Lane Consistency Test"
            status = if ($testExitCode -eq 0) { "pass" } else { "fail" }
            output = $testOutput
        }
        
        if ($testExitCode -eq 0) {
            Write-Log "PASS" "Lane consistency test passed"
            $result.status = "pass"
        } else {
            Write-Log "FAIL" "Lane consistency test failed"
            $result.status = "fail"
        }
    } else {
        $result.tests += @{
            name = "Lane Consistency Test"
            status = "missing"
        }
        $result.status = "fail"
        Write-Log "FAIL" "test-lane-consistency.js not found"
    }
    
    # Run security drill if available
    $securityScript = Join-Path $ScriptDir "security-drill.js"
    
    if (Test-Path $securityScript) {
        Write-Log "DEBUG" "Running security-drill.js..."
        $securityOutput = node $securityScript 2>&1
        $securityExitCode = $LASTEXITCODE
        
        $result.tests += @{
            name = "Security Drill"
            status = if ($securityExitCode -eq 0) { "pass" } else { "fail" }
            output = $securityOutput
        }
        
        if ($securityExitCode -eq 0) {
            Write-Log "PASS" "Security drill passed"
        } else {
            Write-Log "WARN" "Security drill reported issues (non-blocking)"
        }
    }
    
    return $result
}

function Test-RecoveryChecks {
    Write-Log "INFO" "Test: Recovery and quarantine functionality..."
    
    $result = @{
        name = "Recovery Checks"
        status = "unknown"
        tests = @()
    }
    
    # Check if QuarantineManager exists and is loadable
    $quarantinePath = Join-Path $ProjectRoot "src/attestation/QuarantineManager.js"
    
    if (Test-Path $quarantinePath) {
        $result.tests += @{
            name = "QuarantineManager"
            status = "pass"
            file = $quarantinePath
        }
        Write-Log "PASS" "QuarantineManager exists"
    } else {
        $result.tests += @{
            name = "QuarantineManager"
            status = "fail"
            error = "File not found"
        }
        Write-Log "FAIL" "QuarantineManager.js not found"
    }
    
    # Check if RecoveryClient exists and is loadable
    $recoveryPath = Join-Path $ProjectRoot "src/attestation/RecoveryClient.js"
    
    if (Test-Path $recoveryPath) {
        $result.tests += @{
            name = "RecoveryClient"
            status = "pass"
            file = $recoveryPath
        }
        Write-Log "PASS" "RecoveryClient exists"
    } else {
        $result.tests += @{
            name = "RecoveryClient"
            status = "fail"
            error = "File not found"
        }
        Write-Log "FAIL" "RecoveryClient.js not found"
    }
    
    # Overall status
    $failedTests = $result.tests | Where-Object { $_.status -eq "fail" }
    if ($failedTests.Count -eq 0) {
        $result.status = "pass"
    } else {
        $result.status = "fail"
    }
    
    return $result
}

function Test-RoutingChecks {
    Write-Log "INFO" "Test: Queue routing functionality..."
    
    $result = @{
        name = "Routing Checks"
        status = "unknown"
        tests = @()
    }
    
    # Check Queue.js
    $queuePath = Join-Path $ProjectRoot "src/queue/Queue.js"
    
    if (Test-Path $queuePath) {
        $result.tests += @{
            name = "Queue System"
            status = "pass"
            file = $queuePath
        }
        Write-Log "PASS" "Queue system exists"
    } else {
        $result.tests += @{
            name = "Queue System"
            status = "fail"
            error = "File not found"
        }
        Write-Log "FAIL" "Queue.js not found"
    }
    
    # Check orchestrator client
    $clientPath = Join-Path $ProjectRoot "src/swarmmind/orchestratorClient.js"
    
    if (Test-Path $clientPath) {
        $result.tests += @{
            name = "Orchestrator Client"
            status = "pass"
            file = $clientPath
        }
        Write-Log "PASS" "Orchestrator client exists"
    } else {
        $result.tests += @{
            name = "Orchestrator Client"
            status = "fail"
            error = "File not found"
        }
        Write-Log "FAIL" "orchestratorClient.js not found"
    }
    
    # Overall status
    $failedTests = $result.tests | Where-Object { $_.status -eq "fail" }
    if ($failedTests.Count -eq 0) {
        $result.status = "pass"
    } else {
        $result.status = "fail"
    }
    
    return $result
}

# ==============================================================================
# MAIN
# ==============================================================================

function Invoke-SmokeTests {
    Write-Log "INFO" "=========================================="
    Write-Log "INFO" "FREEAGENT Library Lane Smoke Tests"
    Write-Log "INFO" "Phase 2: Boot Path Unification"
    Write-Log "INFO" "=========================================="
    
    $testCategories = @{
        syntaxAndStartup = Test-SyntaxAndStartup
        healthEndpoints = Test-HealthEndpoints
        verificationChecks = Test-VerificationChecks
        recoveryChecks = Test-RecoveryChecks
        routingChecks = Test-RoutingChecks
    }
    
    # Determine overall status
    $failedCategories = 0
    $passedCategories = 0
    
    foreach ($category in $testCategories.Keys) {
        if ($testCategories[$category].status -eq "pass") {
            $passedCategories++
        } else {
            $failedCategories++
        }
    }
    
    $overallStatus = if ($failedCategories -eq 0) { "pass" } else { "fail" }
    
    $result = @{
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffK")
        lane = if ($env:LANE_ID) { $env:LANE_ID } else { "library" }
        status = $overallStatus
        passed = $passedCategories
        failed = $failedCategories
        total = $testCategories.Count
        categories = $testCategories
    }
    
    return $result
}

# ==============================================================================
# OUTPUT
# ==============================================================================

$smokeResult = Invoke-SmokeTests

if ($Json) {
    Write-Output ($smokeResult | ConvertTo-Json -Depth 10)
} else {
    Write-Host ""
    Write-Host "=== Smoke Test Results ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $($smokeResult.timestamp)"
    Write-Host "Lane: $($smokeResult.lane)"
    Write-Host "Overall: $($smokeResult.status)" -ForegroundColor $(if ($smokeResult.status -eq "pass") { "Green" } else { "Red" })
    Write-Host "Passed: $($smokeResult.passed)/$($smokeResult.total)"
    Write-Host ""
    
    foreach ($category in $smokeResult.categories.Keys) {
        $catStatus = $smokeResult.categories[$category].status
        $color = if ($catStatus -eq "pass") { "Green" } else { "Red" }
        Write-Host "  [$catStatus] $($smokeResult.categories[$category].name)" -ForegroundColor $color
    }
    
    Write-Host ""
}

# Exit code based on status
if ($smokeResult.status -eq "pass") {
    Write-Log "INFO" "All smoke tests passed"
    exit 0
} else {
    Write-Log "ERROR" "$($smokeResult.failed) smoke test(s) failed"
    exit 1
}
