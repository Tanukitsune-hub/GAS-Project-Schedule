param(
  [string]$ReleaseVersion = 'v2.8.8-prepilot',
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$SourceCommit
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$expectedCodeVersion = '2.8.8-prepilot'
$expectedSchemaVersion = '2.6'
$expectedAiSchemaVersion = '2.0'
$expectedMigrationVersion = '3'
$expectedTaskColumnCount = 50
$expectedAuthorityLedgerColumnCount = 21
$expectedAuthorityLedgerName = 'Task Authority Ledger'
$expectedGsNames = @(
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
$reviewedSyntheticFixtures = @(
  'Authorization: Bearer abc.def token=secret-value API_KEY=top-secret',
  'Authorization: Bearer synthetic-secret-token',
  'https://user:password@example.invalid/?api_key=hidden'
)

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
    throw 'Release verification requires a Git checkout containing SourceCommit.'
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

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  throw "Apps Script source directory is missing: $sourceRoot"
}
Assert-SourceCommitExists
if (-not (Test-Path -LiteralPath $payloadRoot -PathType Container)) {
  throw "Release payload directory is missing: $payloadRoot"
}

$actualSourceGsNames = @(
  Get-ChildItem -LiteralPath $sourceRoot -Filter '*.gs' -File |
    ForEach-Object { $_.Name } |
    Sort-Object
)
$missingSourceGs = @($expectedGsNames | Where-Object {
    $_ -notin $actualSourceGsNames
  })
$unexpectedSourceGs = @($actualSourceGsNames | Where-Object {
    $_ -notin $expectedGsNames
  })
if ($missingSourceGs.Count -or $unexpectedSourceGs.Count) {
  throw (
    'Source Apps Script filename allow-list mismatch. Missing=' +
    "$($missingSourceGs -join ','), Unexpected=" +
    "$($unexpectedSourceGs -join ',')"
  )
}
if (-not (Test-Path -LiteralPath (
      Join-Path $sourceRoot 'appsscript.json'
    ) -PathType Leaf)) {
  throw 'Source appsscript.json is missing.'
}

$expectedPayloadNames = @($expectedGsNames + 'appsscript.json' | Sort-Object)
$actualPayloadNames = @(
  Get-ChildItem -LiteralPath $payloadRoot -File -Force |
    ForEach-Object { $_.Name } |
    Sort-Object
)
$payloadDirectories = @(Get-ChildItem -LiteralPath $payloadRoot -Directory -Force)
$missingPayload = @($expectedPayloadNames | Where-Object {
    $_ -notin $actualPayloadNames
  })
$unexpectedPayload = @($actualPayloadNames | Where-Object {
    $_ -notin $expectedPayloadNames
  })
if ($payloadDirectories.Count -or $missingPayload.Count -or $unexpectedPayload.Count) {
  throw (
    'Release payload inventory mismatch. Missing=' +
    "$($missingPayload -join ','), Unexpected=" +
    "$($unexpectedPayload -join ','), Directories=$($payloadDirectories.Count)"
  )
}

$payloadRecords = @()
foreach ($name in $expectedPayloadNames) {
  $sourcePath = Join-Path $sourceRoot $name
  $packagePath = Join-Path $payloadRoot $name
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
    throw "Source payload file is missing: $name"
  }
  $sourceHash = Get-LowerSha256 -Path $sourcePath
  $packageHash = Get-LowerSha256 -Path $packagePath
  if ($sourceHash -ne $packageHash) {
    throw "Source/package parity failed: apps-script/$name"
  }
  $payloadRecords += [pscustomobject]@{
    Path = "apps-script/$name"
    Hash = $packageHash
  }
}
$payloadRecords = @($payloadRecords | Sort-Object Path)
$canonicalPayload = (
  $payloadRecords |
    ForEach-Object { "$($_.Hash)  $($_.Path)" }
) -join "`n"
$canonicalPayload += "`n"
$payloadBundleHash = Get-CanonicalHash -Text $canonicalPayload

$configText = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $sourceRoot '00_Config.gs'
)
$requiredConfigPatterns = @(
  "CODE_VERSION:\s*'$([regex]::Escape($expectedCodeVersion))'",
  "SCHEMA_VERSION:\s*'$([regex]::Escape($expectedSchemaVersion))'",
  "AI_SCHEMA_VERSION:\s*'$([regex]::Escape($expectedAiSchemaVersion))'",
  "MIGRATION_VERSION:\s*'$([regex]::Escape($expectedMigrationVersion))'",
  'TEST_MODE:\s*true',
  'AUTOMATION_ENABLED:\s*false'
)
foreach ($pattern in $requiredConfigPatterns) {
  if ($configText -notmatch $pattern) {
    throw "Release configuration invariant failed: $pattern"
  }
}
Assert-AuthorityContract -ConfigText $configText -SchemaText (
  Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '01_TypesAndSchemas.gs'
  )
) -TaskRepositoryText (
  Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '08_TaskRepository.gs'
  )
)

$manifestObject = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $payloadRoot 'appsscript.json'
) | ConvertFrom-Json
$actualScopes = @($manifestObject.oauthScopes | Sort-Object)
$missingScopes = @($expectedScopes | Where-Object { $_ -notin $actualScopes })
$unexpectedScopes = @($actualScopes | Where-Object { $_ -notin $expectedScopes })
if ($missingScopes.Count -or $unexpectedScopes.Count) {
  throw (
    'OAuth scope allow-list mismatch. Missing=' +
    "$($missingScopes -join ','), Unexpected=$($unexpectedScopes -join ',')"
  )
}
$actualAdvancedServices = @(
  @($manifestObject.dependencies.enabledAdvancedServices) |
    ForEach-Object {
      "$($_.userSymbol)|$($_.serviceId)|$($_.version)"
    } |
    Sort-Object
)
$missingServices = @($expectedAdvancedServices | Where-Object {
    $_ -notin $actualAdvancedServices
  })
$unexpectedServices = @($actualAdvancedServices | Where-Object {
    $_ -notin $expectedAdvancedServices
  })
if ($missingServices.Count -or $unexpectedServices.Count) {
  throw (
    'Advanced Service allow-list mismatch. Missing=' +
    "$($missingServices -join ','), Unexpected=" +
    "$($unexpectedServices -join ',')"
  )
}

$deploymentManifestPath = Join-Path $releaseRoot 'DEPLOYMENT_MANIFEST.md'
$quickstartPath = Join-Path $releaseRoot 'SANDBOX_QUICKSTART.md'
$acceptanceGuidePath = Join-Path $releaseRoot 'MANUAL_ACCEPTANCE_GUIDE.md'
$checksumsPath = Join-Path $releaseRoot 'CHECKSUMS.sha256'
foreach ($requiredFile in @(
    $deploymentManifestPath,
    $quickstartPath,
    $acceptanceGuidePath,
    $checksumsPath
  )) {
  if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
    throw "Required release file is missing: $requiredFile"
  }
}

$deploymentManifestText = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  $deploymentManifestPath
)
if ($deploymentManifestText -match '\{\{[A-Z0-9_]+\}\}') {
  throw 'Deployment manifest contains an unresolved template token.'
}
if ($deploymentManifestText -notmatch [regex]::Escape($payloadBundleHash)) {
  throw 'Deployment manifest canonical payload hash does not match.'
}
foreach ($requiredLiteral in @(
    '| Repository | `Tanukitsune-hub/GAS-Project-Schedule` |',
    "| Source commit | ``$SourceCommit`` |",
    '| Release content commit | `SELF (the Git commit containing this manifest)` |',
    '| Code Version | `2.8.8-prepilot` |',
    '| Schema Version | `2.6` |',
    '| AI Schema Version | `2.0` |',
    '| Migration Version | `3` |',
    '| Task canonical columns | `50` |',
    '| Authority store | `protected hidden Task Authority Ledger` |',
    '| Authority ledger columns | `21` |',
    '| Authority protocol | `versioned two-slot PREPARED/COMMITTED` |',
    '| Snapshot-cell fallback | `FORBIDDEN` |',
    '| TEST_MODE | `true` |',
    '| Automation default | `OFF` |',
    '| Highest local status | `PHASE8B_SANDBOX_NO_GO_DASHBOARD_SURFACE` |'
  )) {
  if (-not $deploymentManifestText.Contains($requiredLiteral)) {
    throw "Deployment manifest invariant failed: $requiredLiteral"
  }
}

$allPackageFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
    } |
    Sort-Object
)
$filesToChecksum = @($allPackageFiles | Where-Object {
    $_ -ne 'CHECKSUMS.sha256'
  })
$checksumLines = @(
  Get-Content -Encoding UTF8 -LiteralPath $checksumsPath |
    Where-Object { $_ -ne '' }
)
$checksumRecords = @()
foreach ($line in $checksumLines) {
  if ($line -notmatch '^([0-9a-f]{64})  (.+)$') {
    throw "Invalid CHECKSUMS.sha256 record: $line"
  }
  $checksumRecords += [pscustomobject]@{
    Hash = $Matches[1]
    Path = $Matches[2]
  }
}
$checksumPaths = @($checksumRecords | ForEach-Object { $_.Path } | Sort-Object)
$duplicateChecksumPaths = @(
  $checksumRecords |
    Group-Object Path |
    Where-Object { $_.Count -ne 1 } |
    ForEach-Object { $_.Name }
)
$missingChecksum = @($filesToChecksum | Where-Object {
    $_ -notin $checksumPaths
  })
$unexpectedChecksum = @($checksumPaths | Where-Object {
    $_ -notin $filesToChecksum
  })
if (
  $checksumRecords.Count -ne $filesToChecksum.Count -or
  $duplicateChecksumPaths.Count -or
  $missingChecksum.Count -or
  $unexpectedChecksum.Count
) {
  throw (
    "Checksum record mismatch. Records=$($checksumRecords.Count), " +
    "Files=$($filesToChecksum.Count), Duplicate=" +
    "$($duplicateChecksumPaths -join ','), Missing=" +
    "$($missingChecksum -join ','), Unexpected=$($unexpectedChecksum -join ',')"
  )
}
foreach ($record in $checksumRecords) {
  $path = Join-Path $releaseRoot ($record.Path.Replace('/', '\'))
  if ($record.Hash -ne (Get-LowerSha256 -Path $path)) {
    throw "Checksum mismatch: $($record.Path)"
  }
}

$prohibitedNames = @(
  $allPackageFiles | Where-Object {
    $_ -match '(^|/)(\.clasp\.json|\.env($|\.)|.*credential.*|.*\.pem|.*\.p12|.*\.key)$'
  }
)
if ($prohibitedNames.Count) {
  throw "Prohibited package filename: $($prohibitedNames -join ', ')"
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
$reviewedFixtureCount = 0
foreach ($relativePath in $allPackageFiles) {
  if ($relativePath -eq 'CHECKSUMS.sha256') {
    continue
  }
  $path = Join-Path $releaseRoot ($relativePath.Replace('/', '\'))
  $scanContent = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
  foreach ($fixture in $reviewedSyntheticFixtures) {
    $occurrences = ([regex]::Matches(
      $scanContent,
      [regex]::Escape($fixture)
    )).Count
    if ($occurrences) {
      if ($relativePath -ne 'apps-script/99_TestHarness.gs') {
        throw "Synthetic fixture escaped TestHarness: $relativePath"
      }
      $reviewedFixtureCount += $occurrences
      $scanContent = $scanContent.Replace($fixture, '')
    }
  }
  if ($prohibitedContent.IsMatch($scanContent)) {
    throw "Prohibited content pattern: $relativePath"
  }
}

$quickstartText = Get-Content -Raw -Encoding UTF8 -LiteralPath $quickstartPath
$localLinkMatches = [regex]::Matches(
  $quickstartText,
  '\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)'
)
$checkedLinks = 0
foreach ($match in $localLinkMatches) {
  $target = $match.Groups[1].Value
  if ($target -match '^[a-z]+://' -or $target.StartsWith('#')) {
    continue
  }
  $resolvedTarget = [System.IO.Path]::GetFullPath(
    (Join-Path (Split-Path $quickstartPath -Parent) $target)
  )
  if (-not (Test-Path -LiteralPath $resolvedTarget)) {
    throw "Broken Quickstart local link: $target"
  }
  $checkedLinks++
}

[pscustomobject]@{
  Release = $ReleaseVersion
  PackageFiles = $allPackageFiles.Count
  PayloadFiles = $payloadRecords.Count
  SourceParity = 'PASS'
  Checksums = 'PASS'
  CanonicalPayloadSha256 = $payloadBundleHash
  ActualSecretScan = 'PASS'
  ReviewedSyntheticFixtures = $reviewedFixtureCount
  QuickstartLocalLinks = "$checkedLinks PASS"
  TestMode = $true
  AutomationDefault = 'OFF'
  Provenance = 'PASS'
  HighestLocalStatus = 'PHASE8B_SANDBOX_NO_GO_DASHBOARD_SURFACE'
} | Format-List
