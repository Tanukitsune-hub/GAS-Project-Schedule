param(
  [string]$ReleaseVersion = 'v2.8.18-prepilot-phase8c',
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$SourceCommit
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$expectedCodeVersion = '2.8.18-prepilot'
$expectedSchemaVersion = '2.6'
$expectedAiSchemaVersion = '2.0'
$expectedMigrationVersion = '3'
$expectedTaskColumnCount = 50
$expectedAuthorityLedgerColumnCount = 21
$expectedAuthorityLedgerName = 'Task Authority Ledger'
$expectedModuleContractId = 'WORK_OS_V2_S90_CONTRACT_2_8_11'
$moduleRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $moduleRoot '../..'))
$sourceRoot = Join-Path $moduleRoot 'apps-script-v2'
$releaseRoot = Join-Path $moduleRoot "release\$ReleaseVersion"
$payloadRoot = Join-Path $releaseRoot 'apps-script'

function Get-LowerSha256 {
  param([Parameter(Mandatory = $true)][string]$Path)
  return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash.ToLowerInvariant()
}

function Get-CanonicalHash {
  param([Parameter(Mandatory = $true)][string]$Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
    return ([System.BitConverter]::ToString(
      $sha.ComputeHash($bytes)
    ) -replace '-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Assert-SourceCommitExists {
  $git = Get-Command -Name git -ErrorAction SilentlyContinue
  if (-not $git) {
    throw 'Git executable is required to verify SourceCommit provenance.'
  }
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $insideWorkTree = @(& $git.Path -C $repoRoot rev-parse --is-inside-work-tree 2>$null)
    $insideExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($insideExitCode -ne 0 -or (($insideWorkTree -join "`n").Trim() -ne 'true')) {
    throw 'Phase 8C verification requires a Git checkout containing SourceCommit.'
  }
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $resolved = @(& $git.Path -C $repoRoot rev-parse --verify "$SourceCommit^{commit}" 2>$null)
    $resolvedExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($resolvedExitCode -ne 0) {
    throw 'SourceCommit does not exist in this checkout.'
  }
  if ((($resolved -join "`n").Trim()).ToLowerInvariant() -ne $SourceCommit.ToLowerInvariant()) {
    throw 'SourceCommit did not resolve to the exact supplied 40-character commit.'
  }
}

function Assert-AuthorityContract {
  param(
    [Parameter(Mandatory = $true)][string]$ConfigText,
    [Parameter(Mandatory = $true)][string]$SchemaText,
    [Parameter(Mandatory = $true)][string]$TaskRepositoryText
  )
  $taskColumnsMatch = [regex]::Match(
    $SchemaText,
    'var taskColumns = \[(?<columns>[\s\S]*?)\n  \];'
  )
  if (-not $taskColumnsMatch.Success -or
      ([regex]::Matches(
        $taskColumnsMatch.Groups['columns'].Value,
        '(?m)^\s*column\('
      ).Count -ne $expectedTaskColumnCount)) {
    throw "Task canonical schema must contain $expectedTaskColumnCount columns."
  }
  $ledgerColumnsMatch = [regex]::Match(
    $SchemaText,
    'schemas\[WorkOsConfig\.SHEETS\.TASK_AUTHORITY_LEDGER\] = \[(?<columns>[\s\S]*?)\n  \];'
  )
  if (-not $ledgerColumnsMatch.Success -or
      ([regex]::Matches(
        $ledgerColumnsMatch.Groups['columns'].Value,
        '(?m)^\s*column\('
      ).Count -ne $expectedAuthorityLedgerColumnCount)) {
    throw "Authority ledger schema must contain $expectedAuthorityLedgerColumnCount columns."
  }
  foreach ($requiredLiteral in @(
      "TASK_AUTHORITY_LEDGER: '$expectedAuthorityLedgerName'",
      "AUTHORITY_LEDGER_CHUNK_ROWS: $expectedTaskColumnCount",
      'AUTHORITY_MIGRATION_STATE:'
    )) {
    if (-not $ConfigText.Contains($requiredLiteral)) {
      throw "Authority configuration invariant failed: $requiredLiteral"
    }
  }
  foreach ($requiredLiteral in @(
      'function validateAuthority',
      'function prepareAuthorityLedgerCommit',
      'function commitAuthorityRow',
      'function recoverPreparedAuthority',
      'inspect authoritative_snapshot_json or a cell note as a trust source'
    )) {
    if (-not $TaskRepositoryText.Contains($requiredLiteral)) {
      throw "Authority protocol invariant failed: $requiredLiteral"
    }
  }
}

function Assert-DashboardWriteVisibilityContract {
  param(
    [Parameter(Mandatory = $true)][string]$ConfigText,
    [Parameter(Mandatory = $true)][string]$SetupText,
    [Parameter(Mandatory = $true)][string]$DashboardText,
    [Parameter(Mandatory = $true)][string]$DiagnosticsText
  )
  foreach ($binding in @(
      @{ Name = 'Config'; Text = $ConfigText; Pattern = "S90_MODULE_CONTRACT_ID:\s*'$([regex]::Escape($expectedModuleContractId))'" },
      @{ Name = 'Setup'; Text = $SetupText; Pattern = "var MODULE_CONTRACT_ID = '$([regex]::Escape($expectedModuleContractId))'" },
      @{ Name = 'Dashboard'; Text = $DashboardText; Pattern = "var MODULE_CONTRACT_ID = '$([regex]::Escape($expectedModuleContractId))'" }
    )) {
    if (([regex]::Matches($binding.Text, $binding.Pattern)).Count -ne 1) {
      throw "$($binding.Name) module-contract binding must occur exactly once."
    }
  }
  foreach ($literal in @(
      'E_MODULE_VERSION_SKEW',
      'assertS90ModuleContract',
      'safeNormalizationEvidence',
      'normalizationEvidenceFromResult',
      'storeLastResult',
      'dashboard_number_format_normalization',
      'module_contract_status'
    )) {
    if (-not $SetupText.Contains($literal)) {
      throw "Setup S90 write-visibility invariant failed: $literal"
    }
  }
  foreach ($literal in @(
      'function normalizeSystemBlockNumberFormatForSetup',
      'E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION',
      'NUMBER_FORMAT_FLUSH_UNAVAILABLE',
      'NUMBER_FORMAT_POSTCONDITION_FAILED',
      'FAILED_POSTCONDITION',
      'flush_performed',
      'postcondition_verified',
      'checked_cell_count',
      'noncanonical_count',
      'assertModuleContract'
    )) {
    if (-not $DashboardText.Contains($literal)) {
      throw "Dashboard write-visibility invariant failed: $literal"
    }
  }
  $normalizerStart = $DashboardText.IndexOf(
    'function normalizeSystemBlockNumberFormatForSetup'
  )
  if ($normalizerStart -lt 0) {
    throw 'Setup-owned Dashboard number-format normalizer is missing.'
  }
  $writeIndex = $DashboardText.IndexOf(
    'range.setNumberFormat(CANONICAL_SYSTEM_BLOCK_TEXT_FORMAT)',
    $normalizerStart
  )
  if ($writeIndex -lt 0) {
    throw 'Setup-owned Dashboard number-format write is missing.'
  }
  $flushIndex = $DashboardText.IndexOf(
    'SpreadsheetApp.flush()',
    $writeIndex
  )
  if ($flushIndex -le $writeIndex) {
    throw 'Dashboard number-format flush boundary is missing.'
  }
  $freshRangeIndex = $DashboardText.IndexOf(
    'freshRange = sheet.getRange(',
    $flushIndex
  )
  if ($freshRangeIndex -le $flushIndex) {
    throw 'Dashboard postcondition fresh Range is missing.'
  }
  $postconditionReadIndex = $DashboardText.IndexOf(
    'postconditionFormats = freshRange.getNumberFormats()',
    $freshRangeIndex
  )
  if ($postconditionReadIndex -le $freshRangeIndex) {
    throw 'Setup-only write -> flush -> fresh Range -> strict postcondition ordering is missing.'
  }
  if (-not $SetupText.Contains(
      'WorkOsDashboard.normalizeSystemBlockNumberFormatForSetup(spreadsheet)'
    )) {
    throw 'Setup S90 must invoke the Dashboard number-format normalizer.'
  }
  foreach ($forbiddenDiagnosticWrite in @(
      'setNumberFormat(',
      'setNumberFormats(',
      'SpreadsheetApp.flush()',
      'normalizeSystemBlockNumberFormatForSetup('
    )) {
    if ($DiagnosticsText.Contains($forbiddenDiagnosticWrite)) {
      throw "Diagnostics must remain read-only: $forbiddenDiagnosticWrite"
    }
  }
}

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  throw 'Apps Script source directory is missing.'
}
Assert-SourceCommitExists
if (-not (Test-Path -LiteralPath $payloadRoot -PathType Container)) {
  throw 'Phase 8C payload is missing.'
}
$payloadFiles = @(
  Get-ChildItem -LiteralPath $payloadRoot -File -Force |
    Sort-Object Name
)
$payloadDirectories = @(
  Get-ChildItem -LiteralPath $payloadRoot -Directory -Force
)
if ($payloadDirectories.Count -or $payloadFiles.Count -ne 23) {
  throw 'Phase 8C payload inventory must be 22 .gs plus appsscript.json.'
}
if (
  @($payloadFiles | Where-Object { $_.Extension -eq '.gs' }).Count -ne 22 -or
  -not (Test-Path -LiteralPath (
      Join-Path $payloadRoot 'appsscript.json'
    ) -PathType Leaf) -or
  (Test-Path -LiteralPath (
      Join-Path $payloadRoot '99_TestHarness.gs'
    ) -PathType Leaf)
) {
  throw 'Phase 8C Test Harness exclusion or payload type check failed.'
}

$sourceConfigPath = Join-Path $sourceRoot '00_Config.gs'
$sourceConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceConfigPath
Assert-AuthorityContract -ConfigText $sourceConfig -SchemaText (
  Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '01_TypesAndSchemas.gs'
  )
) -TaskRepositoryText (
  Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '08_TaskRepository.gs'
  )
)
$expectedConfig = [regex]::Replace(
  $sourceConfig,
  'TEST_MODE:\s*true',
  'TEST_MODE: false'
)
$payloadConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $payloadRoot '00_Config.gs'
)
if ($payloadConfig -ne $expectedConfig) {
  throw 'Phase 8C Config is not the exact audited TEST_MODE transform.'
}
foreach ($pattern in @(
    "CODE_VERSION:\s*'$([regex]::Escape($expectedCodeVersion))'",
    "SCHEMA_VERSION:\s*'$([regex]::Escape($expectedSchemaVersion))'",
    "AI_SCHEMA_VERSION:\s*'$([regex]::Escape($expectedAiSchemaVersion))'",
    "MIGRATION_VERSION:\s*'$([regex]::Escape($expectedMigrationVersion))'",
    'TEST_MODE:\s*false',
    'AUTOMATION_ENABLED:\s*false'
  )) {
  if ($payloadConfig -notmatch $pattern) {
    throw "Phase 8C configuration invariant failed: $pattern"
  }
}
Assert-DashboardWriteVisibilityContract `
  -ConfigText $payloadConfig `
  -SetupText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $payloadRoot '02_Setup.gs'
  )) `
  -DashboardText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $payloadRoot '15_Dashboard.gs'
  )) `
  -DiagnosticsText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $payloadRoot '16_Diagnostics.gs'
  ))
foreach ($file in @($payloadFiles | Where-Object {
      $_.Name -ne '00_Config.gs'
    })) {
  $sourcePath = Join-Path $sourceRoot $file.Name
  if (
    -not (Test-Path -LiteralPath $sourcePath -PathType Leaf) -or
    (Get-LowerSha256 -Path $sourcePath) -ne
      (Get-LowerSha256 -Path $file.FullName)
  ) {
    throw "Source/package parity failed: $($file.Name)"
  }
}

$expectedScopes = @(
  'https://www.googleapis.com/auth/spreadsheets.currentonly',
  'https://www.googleapis.com/auth/script.container.ui',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/script.external_request'
)
$expectedAdvancedServices = @(
  'Calendar|calendar|v3',
  'Gmail|gmail|v1'
)
$manifestObject = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $payloadRoot 'appsscript.json'
) | ConvertFrom-Json
$actualScopes = @($manifestObject.oauthScopes | Sort-Object)
if (
  $actualScopes.Count -ne $expectedScopes.Count -or
  @($expectedScopes | Where-Object { $_ -notin $actualScopes }).Count -or
  @($actualScopes | Where-Object { $_ -notin $expectedScopes }).Count
) {
  throw 'Phase 8C OAuth scope allow-list mismatch.'
}
$actualAdvancedServices = @(
  @($manifestObject.dependencies.enabledAdvancedServices) |
    ForEach-Object {
      "$($_.userSymbol)|$($_.serviceId)|$($_.version)"
    } |
    Sort-Object
)
if (
  @($expectedAdvancedServices | Where-Object {
      $_ -notin $actualAdvancedServices
    }).Count -or
  @($actualAdvancedServices | Where-Object {
      $_ -notin $expectedAdvancedServices
    }).Count
) {
  throw 'Phase 8C Advanced Service allow-list mismatch.'
}

$requiredRootFiles = @(
  'CHECKSUMS.sha256',
  'DEPLOYMENT_MANIFEST.md',
  'PHASE8C_SANDBOX_GUIDE.md'
)
foreach ($name in $requiredRootFiles) {
  if (-not (Test-Path -LiteralPath (
        Join-Path $releaseRoot $name
      ) -PathType Leaf)) {
    throw "Required Phase 8C document is missing: $name"
  }
}
$allFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
    } |
    Sort-Object
)
$checksumPath = Join-Path $releaseRoot 'CHECKSUMS.sha256'
$checksumRecords = @(
  Get-Content -Encoding UTF8 -LiteralPath $checksumPath |
    Where-Object { $_ -ne '' }
)
$filesToChecksum = @($allFiles | Where-Object {
    $_ -ne 'CHECKSUMS.sha256'
  })
if ($checksumRecords.Count -ne $filesToChecksum.Count) {
  throw 'Phase 8C checksum record count mismatch.'
}
foreach ($line in $checksumRecords) {
  if ($line -notmatch '^([0-9a-f]{64})  (.+)$') {
    throw "Invalid Phase 8C checksum record: $line"
  }
  $path = Join-Path $releaseRoot ($Matches[2].Replace('/', '\'))
  if (
    -not (Test-Path -LiteralPath $path -PathType Leaf) -or
    $Matches[1] -ne (Get-LowerSha256 -Path $path)
  ) {
    throw "Phase 8C checksum mismatch: $($Matches[2])"
  }
}
if (@($allFiles | Where-Object {
      $_ -match '(^|/)(\.clasp\.json|\.env($|\.)|.*\.pem|.*\.p12|.*\.key)$'
    }).Count) {
  throw 'Phase 8C prohibited filename scan failed.'
}
$prohibitedContent = [regex]::new(
  '(sk-[A-Za-z0-9_-]{20,}|' +
  'AIza[0-9A-Za-z_-]{20,}|' +
  'ya29\.[A-Za-z0-9_-]{20,}|' +
  'gh[pousr]_[A-Za-z0-9]{20,}|' +
  '[0-9]+-[a-z0-9]{20,}\.apps\.googleusercontent\.com|' +
  '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|' +
  'https?://[^/\s:@]+:[^@\s/]+@|' +
  'https://(docs\.google\.com/(spreadsheets|document)|' +
  'drive\.google\.com|script\.google\.com|calendar\.google\.com)/|' +
  '(?<![A-Za-z])[A-Za-z]:\\|' +
  '\\\\[^\\\s]+\\[^\\\s]+|' +
  '/(home|Users)/[^/\s]+/|' +
  'OneDrive\\[^\\]+\\)',
  [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)
foreach ($relativePath in $allFiles) {
  if ($relativePath -eq 'CHECKSUMS.sha256') {
    continue
  }
  $path = Join-Path $releaseRoot ($relativePath.Replace('/', '\'))
  $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
  if ($prohibitedContent.IsMatch($content)) {
    throw "Phase 8C prohibited content pattern: $relativePath"
  }
}
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $releaseRoot 'DEPLOYMENT_MANIFEST.md'
)
$payloadRecords = @(
  $payloadFiles |
    ForEach-Object {
      [pscustomobject]@{
        Path = "apps-script/$($_.Name)"
        Hash = Get-LowerSha256 -Path $_.FullName
      }
    } |
    Sort-Object Path
)
$canonicalPayload = (
  $payloadRecords |
    ForEach-Object { "$($_.Hash)  $($_.Path)" }
) -join "`n"
$canonicalPayload += "`n"
$payloadBundleHash = Get-CanonicalHash -Text $canonicalPayload
if (-not $manifest.Contains($payloadBundleHash)) {
  throw 'Phase 8C canonical payload hash does not match the manifest.'
}
foreach ($literal in @(
    '| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |',
    "| Source commit | ``$SourceCommit`` |",
    '| Release content commit | `SELF (the Git commit containing this manifest)` |',
    '| Code Version | `2.8.18-prepilot` |',
    '| Schema Version | `2.6` |',
    '| AI Schema Version | `2.0` |',
    '| Migration Version | `3` |',
    '| Task canonical columns | `50` |',
    '| Authority store | `protected hidden Task Authority Ledger` |',
    '| Authority ledger columns | `21` |',
    '| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |',
    '| Snapshot-cell fallback | `FORBIDDEN` |',
    '| TEST_MODE | `false` |',
    '| Automation default | `OFF` |',
    '| Highest local status | `READY_FOR_CONTROLLED_SANDBOX_VALIDATION` |',
    '`99_TestHarness.gs`: `EXCLUDED`'
  )) {
  if (-not $manifest.Contains($literal)) {
    throw "Phase 8C manifest invariant failed: $literal"
  }
}

[pscustomobject]@{
  Release = $ReleaseVersion
  PackageFiles = $allFiles.Count
  PayloadFiles = $payloadFiles.Count
  SourceParityExceptAuditedTestModeTransform = 'PASS'
  Checksums = 'PASS'
  CanonicalPayloadHash = $payloadBundleHash
  OAuthScopeAllowList = 'PASS'
  AdvancedServiceAllowList = 'PASS'
  ActualSecretScan = 'PASS'
  TestHarnessExcluded = 'PASS'
  ClaspExcluded = 'PASS'
  TestMode = $false
  AutomationDefault = 'OFF'
  Provenance = 'PASS'
  SourceCommitExists = 'PASS'
  HighestLocalStatus = 'READY_FOR_CONTROLLED_SANDBOX_VALIDATION'
} | Format-List
