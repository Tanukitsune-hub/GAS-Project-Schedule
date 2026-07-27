param(
  [string]$ReleaseVersion = 'v2.8.2-prepilot-phase8c'
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
    "CODE_VERSION:\s*'2\.8\.2-prepilot'",
    "SCHEMA_VERSION:\s*'2\.3'",
    "AI_SCHEMA_VERSION:\s*'2\.0'",
    "MIGRATION_VERSION:\s*'0'",
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
  'drive\.google\.com|script\.google\.com|calendar\.google\.com)/)',
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
foreach ($literal in @(
    '| Code Version | `2.8.2-prepilot` |',
    '| Schema Version | `2.3` |',
    '| TEST_MODE | `false` |',
    '| Automation default | `OFF` |',
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
  ActualSecretScan = 'PASS'
  TestHarnessExcluded = 'PASS'
  ClaspExcluded = 'PASS'
  TestMode = $false
  AutomationDefault = 'OFF'
} | Format-List
