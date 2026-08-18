param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$SourceCommit,
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^\d{4}-\d{2}-\d{2}T')]
  [string]$PreparedAt,
  [string]$Repository = 'Tanukitsune-hub/GAS-Project-Schedule'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$releaseVersion = 'v2.8.15-prepilot'
$expectedCodeVersion = '2.8.15-prepilot'
$expectedSchemaVersion = '2.6'
$expectedAiSchemaVersion = '2.0'
$expectedMigrationVersion = '3'
$expectedGsCount = 23
$expectedTaskColumnCount = 50
$expectedAuthorityLedgerColumnCount = 21
$expectedAuthorityLedgerName = 'Task Authority Ledger'
$expectedModuleContractId = 'WORK_OS_V2_S90_CONTRACT_2_8_11'
$expectedScopeCount = 8
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
  '20_GeminiProvider.gs',
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
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/script.external_request'
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

$moduleRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $PSScriptRoot '..')
)
$repoRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $moduleRoot '../..')
)
$sourceRoot = Join-Path $moduleRoot 'apps-script-v2'
$templateRoot = Join-Path $PSScriptRoot 'v2_8_15'
$releaseRoot = Join-Path $moduleRoot "release\$releaseVersion"
$payloadRoot = Join-Path $releaseRoot 'apps-script'

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

function Invoke-GitVerification {
  param(
    [Parameter(Mandatory = $true)][string[]]$Arguments,
    [Parameter(Mandatory = $true)][string]$Purpose
  )
  $git = Get-Command -Name git -ErrorAction SilentlyContinue
  if (-not $git) {
    throw "Git executable is required to verify $Purpose. Package generation stopped."
  }
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = @(& $git.Path -C $repoRoot @Arguments 2>$null)
    $gitExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($gitExitCode -ne 0) {
    throw "Git verification failed for ${Purpose}; package generation stopped."
  }
  return (($output -join "`n").Trim())
}

function Assert-ExactSourceCheckout {
  $insideWorkTree = Invoke-GitVerification -Arguments @(
    'rev-parse', '--is-inside-work-tree'
  ) -Purpose 'the source checkout'
  if ($insideWorkTree -ne 'true') {
    throw 'The release package must be built from a Git checkout. Package generation stopped.'
  }
  $resolvedSourceCommit = Invoke-GitVerification -Arguments @(
    'rev-parse', '--verify', "$SourceCommit^{commit}"
  ) -Purpose 'the supplied SourceCommit'
  if ($resolvedSourceCommit.ToLowerInvariant() -ne $SourceCommit.ToLowerInvariant()) {
    throw 'SourceCommit did not resolve to the exact supplied 40-character commit.'
  }
  $headCommit = Invoke-GitVerification -Arguments @(
    'rev-parse', '--verify', 'HEAD^{commit}'
  ) -Purpose 'HEAD'
  if ($headCommit.ToLowerInvariant() -ne $resolvedSourceCommit.ToLowerInvariant()) {
    throw (
      'SourceCommit must exactly match checkout HEAD before package generation. ' +
      'Create/checkout Source A15 first; package generation stopped.'
    )
  }
}

function Assert-CleanCanonicalSourceInputs {
  $status = Invoke-GitVerification -Arguments @(
    'status', '--porcelain', '--',
    'implementation/GoogleSpreadsheet/apps-script-v2',
    'implementation/GoogleSpreadsheet/tools'
  ) -Purpose 'the canonical source inputs'
  if (-not [string]::IsNullOrWhiteSpace($status)) {
    throw 'Canonical source inputs must be clean before package generation. Commit or remove no files; package generation stopped.'
  }
}

function Assert-EmptyReleaseTarget {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }
  $item = Get-Item -LiteralPath $Path -Force
  if (-not $item.PSIsContainer) {
    throw "Release target exists but is not a directory: $Path"
  }
  $existingItems = @(Get-ChildItem -LiteralPath $Path -Force)
  if ($existingItems.Count -ne 0) {
    throw (
      'Release target already exists and is non-empty; refusing to overwrite ' +
      "or merge package contents: $Path"
    )
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
  throw "Apps Script source directory is missing: $sourceRoot"
}
if ($Repository -ne 'Tanukitsune-hub/GAS-Project-Schedule') {
  throw 'Release provenance repository must be Tanukitsune-hub/GAS-Project-Schedule.'
}
Assert-ExactSourceCheckout
Assert-CleanCanonicalSourceInputs
Assert-EmptyReleaseTarget -Path $releaseRoot

$configPath = Join-Path $sourceRoot '00_Config.gs'
$configText = Get-Content -Raw -Encoding UTF8 -LiteralPath $configPath
if ($configText -notmatch "CODE_VERSION:\s*'$([regex]::Escape($expectedCodeVersion))'") {
  throw 'Code Version does not match the release version.'
}
if ($configText -notmatch "SCHEMA_VERSION:\s*'$([regex]::Escape($expectedSchemaVersion))'") {
  throw 'Schema Version does not match the release contract.'
}
if ($configText -notmatch "AI_SCHEMA_VERSION:\s*'$([regex]::Escape($expectedAiSchemaVersion))'") {
  throw 'AI Schema Version does not match the release contract.'
}
if ($configText -notmatch "MIGRATION_VERSION:\s*'$([regex]::Escape($expectedMigrationVersion))'") {
  throw 'Migration Version does not match the release contract.'
}
if ($configText -notmatch 'TEST_MODE:\s*true') {
  throw 'TEST_MODE must remain true.'
}
if ($configText -notmatch 'AUTOMATION_ENABLED:\s*false') {
  throw 'Automation must remain disabled by default.'
}

$schemaPath = Join-Path $sourceRoot '01_TypesAndSchemas.gs'
$schemaText = Get-Content -Raw -Encoding UTF8 -LiteralPath $schemaPath
$taskColumnsMatch = [regex]::Match(
  $schemaText,
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
  $schemaText,
  'schemas\[WorkOsConfig\.SHEETS\.TASK_AUTHORITY_LEDGER\] = \[(?<columns>[\s\S]*?)\n  \];'
)
if (-not $ledgerColumnsMatch.Success -or
    ([regex]::Matches(
      $ledgerColumnsMatch.Groups['columns'].Value,
      '(?m)^\s*column\('
    ).Count -ne $expectedAuthorityLedgerColumnCount)) {
  throw (
    "Authority ledger canonical schema must contain " +
    "$expectedAuthorityLedgerColumnCount columns."
  )
}
foreach ($requiredAuthorityLiteral in @(
    "TASK_AUTHORITY_LEDGER: '$expectedAuthorityLedgerName'",
    "AUTHORITY_LEDGER_CHUNK_ROWS: $expectedTaskColumnCount",
    "AUTHORITY_MIGRATION_STATE:"
  )) {
  if (-not $configText.Contains($requiredAuthorityLiteral)) {
    throw "Authority configuration invariant failed: $requiredAuthorityLiteral"
  }
}
$taskRepositoryText = Get-Content -Raw -Encoding UTF8 -LiteralPath (
  Join-Path $sourceRoot '08_TaskRepository.gs'
)
foreach ($requiredAuthorityLiteral in @(
    'function validateAuthority',
    'function prepareAuthorityLedgerCommit',
    'function commitAuthorityRow',
    'function recoverPreparedAuthority',
    'inspect authoritative_snapshot_json or a cell note as a trust source'
  )) {
  if (-not $taskRepositoryText.Contains($requiredAuthorityLiteral)) {
    throw "Authority protocol invariant failed: $requiredAuthorityLiteral"
  }
}
Assert-DashboardWriteVisibilityContract `
  -ConfigText $configText `
  -SetupText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '02_Setup.gs'
  )) `
  -DashboardText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '15_Dashboard.gs'
  )) `
  -DiagnosticsText (Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $sourceRoot '16_Diagnostics.gs'
  ))

$sourceGs = @(
  Get-ChildItem -LiteralPath $sourceRoot -Filter '*.gs' -File |
    Sort-Object Name
)
if ($sourceGs.Count -ne $expectedGsCount) {
  throw "Expected $expectedGsCount .gs files, found $($sourceGs.Count)."
}
$actualGsNames = @($sourceGs | ForEach-Object { $_.Name } | Sort-Object)
$missingGsNames = @($expectedGsNames | Where-Object {
    $_ -notin $actualGsNames
  })
$unexpectedGsNames = @($actualGsNames | Where-Object {
    $_ -notin $expectedGsNames
  })
if ($missingGsNames.Count -or $unexpectedGsNames.Count) {
  throw (
    "Apps Script filename allow-list mismatch. Missing=" +
    "$($missingGsNames -join ','), Unexpected=" +
    "$($unexpectedGsNames -join ',')"
  )
}

$sourceManifest = Join-Path $sourceRoot 'appsscript.json'
$manifestObject = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceManifest |
  ConvertFrom-Json
if (@($manifestObject.oauthScopes).Count -ne $expectedScopeCount) {
  throw "Expected $expectedScopeCount OAuth scopes."
}
$actualScopes = @($manifestObject.oauthScopes | Sort-Object)
$missingScopes = @($expectedScopes | Where-Object {
    $_ -notin $actualScopes
  })
$unexpectedScopes = @($actualScopes | Where-Object {
    $_ -notin $expectedScopes
  })
if ($missingScopes.Count -or $unexpectedScopes.Count) {
  throw (
    "OAuth scope allow-list mismatch. Missing=" +
    "$($missingScopes -join ','), Unexpected=" +
    "$($unexpectedScopes -join ',')"
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
    "Advanced Service allow-list mismatch. Missing=" +
    "$($missingServices -join ','), Unexpected=" +
    "$($unexpectedServices -join ',')"
  )
}

New-Item -ItemType Directory -Path $payloadRoot | Out-Null

$existingDirectories = @(
  Get-ChildItem -LiteralPath $payloadRoot -Directory -Force
)
if ($existingDirectories.Count -ne 0) {
  throw 'Unexpected subdirectory exists in release apps-script payload.'
}
$expectedPayloadNames = @($expectedGsNames + 'appsscript.json')
$unexpectedExistingFiles = @(
  Get-ChildItem -LiteralPath $payloadRoot -File -Force |
    Where-Object { $_.Name -notin $expectedPayloadNames }
)
if ($unexpectedExistingFiles.Count) {
  throw (
    'Unexpected file exists in release apps-script payload: ' +
    (($unexpectedExistingFiles | ForEach-Object { $_.Name }) -join ', ')
  )
}

$sourceGs | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination (
    Join-Path $payloadRoot $_.Name
  ) -Force
}
Copy-Item -LiteralPath $sourceManifest -Destination (
  Join-Path $payloadRoot 'appsscript.json'
) -Force

$payloadRecords = @()
$sourceGs | ForEach-Object {
  $relativePath = "apps-script/$($_.Name)"
  $packagePath = Join-Path $releaseRoot $relativePath
  $sourceHash = Get-LowerSha256 -Path $_.FullName
  $packageHash = Get-LowerSha256 -Path $packagePath
  if ($sourceHash -ne $packageHash) {
    throw "Source parity failed: $relativePath"
  }
  $payloadRecords += [pscustomobject]@{
    Path = $relativePath
    Hash = $packageHash
  }
}
$manifestHash = Get-LowerSha256 -Path $sourceManifest
$packageManifestPath = Join-Path $payloadRoot 'appsscript.json'
if ($manifestHash -ne (Get-LowerSha256 -Path $packageManifestPath)) {
  throw 'Source parity failed: apps-script/appsscript.json'
}
$payloadRecords += [pscustomobject]@{
  Path = 'apps-script/appsscript.json'
  Hash = $manifestHash
}
$payloadRecords = @($payloadRecords | Sort-Object Path)

$canonicalPayload = (
  $payloadRecords |
    ForEach-Object { "$($_.Hash)  $($_.Path)" }
) -join "`n"
$canonicalPayload += "`n"
$payloadBundleHash = Get-CanonicalHash -Text $canonicalPayload

$sourceCommitValue = "``$SourceCommit``"
$repositoryValue = "``$Repository``"
$releaseCommitValue = '`SELF (the Git commit containing this manifest)`'

$payloadTable = (
  $payloadRecords |
    ForEach-Object { "| ``$($_.Path)`` | ``$($_.Hash)`` |" }
) -join "`n"
$oauthScopes = (
  @($manifestObject.oauthScopes) |
    ForEach-Object { "- ``$($_)``" }
) -join "`n"
$advancedServices = (
  @($manifestObject.dependencies.enabledAdvancedServices) |
    ForEach-Object {
      "- ``$($_.userSymbol)``: service ``$($_.serviceId)``, version ``$($_.version)``"
    }
) -join "`n"

$manifestTemplatePath = Join-Path $templateRoot 'DEPLOYMENT_MANIFEST.template.md'
$manifestText = Get-Content -Raw -Encoding UTF8 -LiteralPath $manifestTemplatePath
$manifestText = $manifestText.Replace('{{PREPARED_AT}}', $PreparedAt)
$manifestText = $manifestText.Replace(
  '{{SOURCE_COMMIT}}',
  $sourceCommitValue
)
$manifestText = $manifestText.Replace(
  '{{REPOSITORY}}',
  $repositoryValue
)
$manifestText = $manifestText.Replace(
  '{{RELEASE_COMMIT}}',
  $releaseCommitValue
)
$manifestText = $manifestText.Replace(
  '{{PAYLOAD_COUNT}}',
  [string]$payloadRecords.Count
)
$manifestText = $manifestText.Replace(
  '{{GS_COUNT}}',
  [string]$sourceGs.Count
)
$manifestText = $manifestText.Replace(
  '{{PAYLOAD_BUNDLE_SHA256}}',
  $payloadBundleHash
)
$manifestText = $manifestText.Replace('{{PAYLOAD_TABLE}}', $payloadTable)
$manifestText = $manifestText.Replace('{{OAUTH_SCOPES}}', $oauthScopes)
$manifestText = $manifestText.Replace(
  '{{ADVANCED_SERVICES}}',
  $advancedServices
)
if ($manifestText -match '\{\{[A-Z0-9_]+\}\}') {
  throw 'Deployment manifest contains an unresolved template token.'
}
Write-Utf8NoBom -Path (
  Join-Path $releaseRoot 'DEPLOYMENT_MANIFEST.md'
) -Content $manifestText

$quickstartTemplate = Join-Path $templateRoot 'SANDBOX_QUICKSTART.md'
Copy-Item -LiteralPath $quickstartTemplate -Destination (
  Join-Path $releaseRoot 'SANDBOX_QUICKSTART.md'
) -Force
$acceptanceTemplate = Join-Path $templateRoot 'MANUAL_ACCEPTANCE_GUIDE.md'
Copy-Item -LiteralPath $acceptanceTemplate -Destination (
  Join-Path $releaseRoot 'MANUAL_ACCEPTANCE_GUIDE.md'
) -Force

$packageFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    Where-Object { $_.Name -ne 'CHECKSUMS.sha256' }
)
$checksumLines = @(
  $packageFiles |
    ForEach-Object {
      $relative = $_.FullName.Substring($releaseRoot.Length + 1).
        Replace('\', '/')
      [pscustomobject]@{
        Path = $relative
        Hash = Get-LowerSha256 -Path $_.FullName
      }
    } |
    Sort-Object Path |
    ForEach-Object { "$($_.Hash)  $($_.Path)" }
)
Write-Utf8NoBom -Path (
  Join-Path $releaseRoot 'CHECKSUMS.sha256'
) -Content (($checksumLines -join "`n") + "`n")

$allowedPackageFiles = @($payloadRecords | ForEach-Object { $_.Path })
$allowedPackageFiles += @(
  'DEPLOYMENT_MANIFEST.md',
  'SANDBOX_QUICKSTART.md',
  'MANUAL_ACCEPTANCE_GUIDE.md',
  'CHECKSUMS.sha256'
)
$allowedPackageFiles = @($allowedPackageFiles | Sort-Object)
$actualPackageFiles = @(
  Get-ChildItem -LiteralPath $releaseRoot -File -Recurse |
    ForEach-Object {
      $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
    } |
    Sort-Object
)
$unexpected = @($actualPackageFiles | Where-Object {
    $_ -notin $allowedPackageFiles
  })
$missing = @($allowedPackageFiles | Where-Object {
    $_ -notin $actualPackageFiles
  })
if ($unexpected.Count -or $missing.Count) {
  throw "Package inventory mismatch. Unexpected=$($unexpected.Count), Missing=$($missing.Count)"
}

$prohibitedNames = @(
  $actualPackageFiles | Where-Object {
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
foreach ($file in Get-ChildItem -LiteralPath $releaseRoot -File -Recurse) {
  if ($file.Name -eq 'CHECKSUMS.sha256') {
    continue
  }
  $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $file.FullName
  $scanContent = $content
  foreach ($fixture in $reviewedSyntheticFixtures) {
    $occurrences = ([regex]::Matches(
      $scanContent,
      [regex]::Escape($fixture)
    )).Count
    if ($occurrences) {
      if ($file.Name -ne '99_TestHarness.gs') {
        throw "Synthetic fixture escaped TestHarness: $($file.FullName)"
      }
      $reviewedFixtureCount += $occurrences
      $scanContent = $scanContent.Replace($fixture, '')
    }
  }
  if ($prohibitedContent.IsMatch($scanContent)) {
    throw "Prohibited content pattern: $($file.FullName)"
  }
}

[pscustomobject]@{
  Release = $releaseVersion
  ReleaseRoot = $releaseRoot
  PayloadFiles = $payloadRecords.Count
  PackageFiles = $actualPackageFiles.Count
  PayloadBundleSha256 = $payloadBundleHash
  SourceParity = 'PASS'
  SecretScan = 'PASS'
  ReviewedSyntheticFixtures = $reviewedFixtureCount
  TestMode = $true
  AutomationDefault = 'OFF'
} | Format-List
