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

$releaseVersion = 'v2.8.4-prepilot'
$expectedCodeVersion = '2.8.4-prepilot'
$expectedSchemaVersion = '2.5'
$expectedAiSchemaVersion = '2.0'
$expectedMigrationVersion = '2'
$expectedGsCount = 22
$expectedScopeCount = 7
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

$repoRoot = [System.IO.Path]::GetFullPath(
  (Join-Path $PSScriptRoot '..')
)
$sourceRoot = Join-Path $repoRoot 'apps-script-v2'
$templateRoot = Join-Path $PSScriptRoot 'v2_8_4'
$releaseRoot = Join-Path $repoRoot "release\$releaseVersion"
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

if (-not (Test-Path -LiteralPath $sourceRoot -PathType Container)) {
  throw "Apps Script source directory is missing: $sourceRoot"
}
if ($Repository -ne 'Tanukitsune-hub/GAS-Project-Schedule') {
  throw 'Release provenance repository must be Tanukitsune-hub/GAS-Project-Schedule.'
}

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

New-Item -ItemType Directory -Force -Path $payloadRoot | Out-Null

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
$releaseCommitValue = '``SELF (the Git commit containing this manifest)``'

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
