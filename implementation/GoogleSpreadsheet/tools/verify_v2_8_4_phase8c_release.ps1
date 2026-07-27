param(
  [string]$ReleaseVersion = 'v2.8.4-prepilot-phase8c',
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$SourceCommit
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceRoot = Join-Path $repoRoot 'apps-script-v2'
$releaseRoot = Join-Path $repoRoot "release\$ReleaseVersion"
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
if ($payloadDirectories.Count -or $payloadFiles.Count -ne 22) {
  throw 'Phase 8C payload inventory must be 21 .gs plus appsscript.json.'
}
if (
  @($payloadFiles | Where-Object { $_.Extension -eq '.gs' }).Count -ne 21 -or
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
    "CODE_VERSION:\s*'2\.8\.4-prepilot'",
    "SCHEMA_VERSION:\s*'2\.5'",
    "AI_SCHEMA_VERSION:\s*'2\.0'",
    "MIGRATION_VERSION:\s*'2'",
    'TEST_MODE:\s*false',
    'AUTOMATION_ENABLED:\s*false'
  )) {
  if ($payloadConfig -notmatch $pattern) {
    throw "Phase 8C configuration invariant failed: $pattern"
  }
}
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
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
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
    '| Code Version | `2.8.4-prepilot` |',
    '| Schema Version | `2.5` |',
    '| AI Schema Version | `2.0` |',
    '| Migration Version | `2` |',
    '| TEST_MODE | `false` |',
    '| Automation default | `OFF` |',
    '| Highest local status | `READY_FOR_INDEPENDENT_REAUDIT` |',
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
  HighestLocalStatus = 'READY_FOR_INDEPENDENT_REAUDIT'
} | Format-List
