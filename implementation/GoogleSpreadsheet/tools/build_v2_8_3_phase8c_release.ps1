param(
  [string]$PreparedAt = '2026-07-27T11:53:10+09:00',
  [string]$SourceCommit = 'NOT AVAILABLE - repository has no commits',
  [string]$SourceTreeStatus = 'Unborn master with pre-existing and remediation working-tree changes; no commit created'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$releaseVersion = 'v2.8.3-prepilot-phase8c'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceRoot = Join-Path $repoRoot 'apps-script-v2'
$releaseRoot = Join-Path $repoRoot "release\$releaseVersion"
$payloadRoot = Join-Path $releaseRoot 'apps-script'
$allSourceGsNames = @(
  '00_Config.gs',
  '01_TypesAndSchemas.gs',
  '02_Setup.gs',
  '03_SheetBuilder.gs',
  '04_MessageStateRepository.gs',
  '05_GmailGateway.gs',
  '06_EmailPreprocessor.gs',
  '07_AiAdapter.gs',
  '08_TaskRepository.gs',
  '09_TaskReviewPolicy.gs',
  '10_CalendarSync.gs',
  '11_EditHandler.gs',
  '12_Triggers.gs',
  '13_LogAndDeadLetter.gs',
  '14_Migrations.gs',
  '15_Dashboard.gs',
  '16_Diagnostics.gs',
  '17_Utilities.gs',
  '18_Worker.gs',
  '19_RuntimeSettings.gs',
  '99_TestHarness.gs',
  'Menu.gs'
)
$payloadGsNames = @(
  $allSourceGsNames | Where-Object { $_ -ne '99_TestHarness.gs' }
)

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

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

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  throw "Apps Script source directory is missing: $sourceRoot"
}
$actualSourceNames = @(
  Get-ChildItem -LiteralPath $sourceRoot -Filter '*.gs' -File |
    ForEach-Object { $_.Name } |
    Sort-Object
)
if (
  @($allSourceGsNames | Where-Object { $_ -notin $actualSourceNames }).Count -or
  @($actualSourceNames | Where-Object { $_ -notin $allSourceGsNames }).Count
) {
  throw 'Source Apps Script filename allow-list mismatch.'
}

$sourceConfigPath = Join-Path $sourceRoot '00_Config.gs'
$sourceConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceConfigPath
foreach ($pattern in @(
    "CODE_VERSION:\s*'2\.8\.3-prepilot'",
    "SCHEMA_VERSION:\s*'2\.4'",
    "AI_SCHEMA_VERSION:\s*'2\.0'",
    "MIGRATION_VERSION:\s*'1'",
    'TEST_MODE:\s*true',
    'AUTOMATION_ENABLED:\s*false'
  )) {
  if ($sourceConfig -notmatch $pattern) {
    throw "Source configuration invariant failed: $pattern"
  }
}
if (([regex]::Matches($sourceConfig, 'TEST_MODE:\s*true')).Count -ne 1) {
  throw 'Expected exactly one TEST_MODE=true source declaration.'
}
$phase8cConfig = [regex]::Replace(
  $sourceConfig,
  'TEST_MODE:\s*true',
  'TEST_MODE: false'
)
if (
  $phase8cConfig -notmatch 'TEST_MODE:\s*false' -or
  $phase8cConfig -match 'TEST_MODE:\s*true'
) {
  throw 'Phase 8C TEST_MODE transformation failed.'
}

New-Item -ItemType Directory -Force -Path $payloadRoot | Out-Null
$allowedPayloadNames = @($payloadGsNames + 'appsscript.json')
$unexpectedExisting = @(
  Get-ChildItem -LiteralPath $payloadRoot -File -Force |
    Where-Object { $_.Name -notin $allowedPayloadNames }
)
if ($unexpectedExisting.Count) {
  throw (
    'Unexpected existing Phase 8C payload file: ' +
    (($unexpectedExisting | ForEach-Object { $_.Name }) -join ', ')
  )
}
if (@(Get-ChildItem -LiteralPath $payloadRoot -Directory -Force).Count) {
  throw 'Unexpected Phase 8C payload subdirectory.'
}

foreach ($name in $payloadGsNames) {
  if ($name -eq '00_Config.gs') {
    Write-Utf8NoBom -Path (Join-Path $payloadRoot $name) -Content $phase8cConfig
  } else {
    Copy-Item -LiteralPath (Join-Path $sourceRoot $name) -Destination (
      Join-Path $payloadRoot $name
    ) -Force
  }
}
Copy-Item -LiteralPath (Join-Path $sourceRoot 'appsscript.json') -Destination (
  Join-Path $payloadRoot 'appsscript.json'
) -Force

if (Test-Path -LiteralPath (
    Join-Path $payloadRoot '99_TestHarness.gs'
  ) -PathType Leaf) {
  throw 'Phase 8C payload must not contain 99_TestHarness.gs.'
}
$payloadConfig = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $payloadRoot '00_Config.gs'
)
if ($payloadConfig -ne $phase8cConfig) {
  throw 'Phase 8C Config differs from the audited TEST_MODE-only transform.'
}
foreach ($name in @($payloadGsNames | Where-Object {
      $_ -ne '00_Config.gs'
    }) + 'appsscript.json') {
  if (
    (Get-LowerSha256 -Path (Join-Path $sourceRoot $name)) -ne
    (Get-LowerSha256 -Path (Join-Path $payloadRoot $name))
  ) {
    throw "Source/package parity failed: $name"
  }
}

$payloadRecords = @(
  Get-ChildItem -LiteralPath $payloadRoot -File |
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
$payloadTable = (
  $payloadRecords |
    ForEach-Object { "| ``$($_.Path)`` | ``$($_.Hash)`` |" }
) -join "`n"

$manifest = @"
# Google Workspace Personal Work OS v2
# Phase 8C Deployment Manifest

## Release identity

| Field | Value |
|---|---|
| Package | ``$releaseVersion`` |
| Code Version | ``2.8.3-prepilot`` |
| Schema Version | ``2.4`` |
| AI Schema Version | ``2.0`` |
| Migration Version | ``1`` |
| TEST_MODE | ``false`` |
| Automation default | ``OFF`` |
| Package prepared at | ``$PreparedAt`` |
| Source commit | ``$SourceCommit`` |
| Source tree status | ``$SourceTreeStatus`` |

This payload is distinct from the Phase 8B package. It excludes
``99_TestHarness.gs`` and applies exactly one audited source transformation:
``00_Config.gs`` changes ``TEST_MODE: true`` to ``TEST_MODE: false``.
All other payload files are byte-identical to ``apps-script-v2/``.

Phase 8C remains ``NO-GO`` until real Provider configuration, company/data/
credential-storage approval, OAuth, and real Google Workspace acceptance are
completed. An unconfigured Provider fails closed.

## Payload

- Payload files: ``$($payloadRecords.Count)``
- ``.gs`` files: ``$($payloadGsNames.Count)``
- Canonical payload-list SHA-256: ``$payloadBundleHash``
- ``99_TestHarness.gs``: ``EXCLUDED``
- ``.clasp.json``: ``EXCLUDED``

| Relative path | SHA-256 |
|---|---|
$payloadTable

## Boundaries

- No real Provider request was executed.
- No real Google Workspace acceptance was executed.
- No credential, API key, password, token, real Workspace ID, or internal URL
  is included.
- OAuth scopes and Advanced Services are unchanged from the reviewed source
  ``appsscript.json``.
"@
Write-Utf8NoBom -Path (
  Join-Path $releaseRoot 'DEPLOYMENT_MANIFEST.md'
) -Content $manifest

$guide = @"
# Phase 8C TEST_MODE=false Sandbox Guide

- Package: ``$releaseVersion``
- Code: ``2.8.3-prepilot``
- Schema: ``2.4``
- TEST_MODE: ``false``
- Automation default: ``OFF``
- Current gate: ``NO-GO``

Do not deploy this package until the responsible human has confirmed the real
Provider, model, endpoint, opaque credential reference, company approval, data
policy approval, and credential-storage approval. Do not place credential
values in this package or evidence.

Before any functional acceptance, verify:

1. ``99_TestHarness.gs`` is absent.
2. Mock/Test menu items are absent after Spreadsheet reload.
3. Direct Mock/test entrypoints return ``E_TEST_MODE_DISABLED``.
4. Missing Production AI configuration is reported separately by
   ``PRODUCTION_AI_CONFIGURATION``, ``PRODUCTION_AI_POLICY_APPROVAL``, and
   ``PRODUCTION_AI_AUTH_READINESS``.
5. Automation remains OFF and no time-driven Trigger exists.

Real OAuth, exact Gmail Message processing, Calendar create/update/delete,
installable edit Trigger events, LockService contention, and runtime behavior
must be recorded as PASS / FAIL / NOT EXECUTED. Local tests do not make these
items PASS.
"@
Write-Utf8NoBom -Path (
  Join-Path $releaseRoot 'PHASE8C_SANDBOX_GUIDE.md'
) -Content $guide

$packageFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    Where-Object { $_.Name -ne 'CHECKSUMS.sha256' }
)
$checksumLines = @(
  $packageFiles |
    ForEach-Object {
      $relative = $_.FullName.Substring($releaseRoot.Length + 1).
        Replace('\', '/')
      "$((Get-LowerSha256 -Path $_.FullName))  $relative"
    } |
    Sort-Object
)
Write-Utf8NoBom -Path (
  Join-Path $releaseRoot 'CHECKSUMS.sha256'
) -Content (($checksumLines -join "`n") + "`n")

$actualFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
    } |
    Sort-Object
)
$expectedFiles = @(
  @($payloadRecords | ForEach-Object { $_.Path }) +
  'CHECKSUMS.sha256' +
  'DEPLOYMENT_MANIFEST.md' +
  'PHASE8C_SANDBOX_GUIDE.md' |
    Sort-Object
)
if (
  @($expectedFiles | Where-Object { $_ -notin $actualFiles }).Count -or
  @($actualFiles | Where-Object { $_ -notin $expectedFiles }).Count
) {
  throw 'Phase 8C package inventory mismatch.'
}
if (@($actualFiles | Where-Object {
      $_ -match '(^|/)(\.clasp\.json|\.env($|\.)|.*\.pem|.*\.p12|.*\.key)$'
    }).Count) {
  throw 'Phase 8C package contains a prohibited filename.'
}

[pscustomobject]@{
  Release = $releaseVersion
  ReleaseRoot = $releaseRoot
  PayloadFiles = $payloadRecords.Count
  PackageFiles = $actualFiles.Count
  PayloadBundleSha256 = $payloadBundleHash
  SourceParityExceptAuditedTestModeTransform = 'PASS'
  TestHarnessExcluded = 'PASS'
  TestMode = $false
  AutomationDefault = 'OFF'
} | Format-List
