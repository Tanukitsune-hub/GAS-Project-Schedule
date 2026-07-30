[CmdletBinding()]
param(
  [string]$TransferDirectory = '',
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$OldFixedRef = '863217b99dfa1ad682a8f4dd1989212b0a8d548b',
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$NewPayloadCommit
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$oldPayloadRoot = 'implementation/GoogleSpreadsheet/release/v2.8.6-prepilot/apps-script'
$newPayloadRoot = 'implementation/GoogleSpreadsheet/release/v2.8.7-prepilot/apps-script'
$moduleRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $moduleRoot '../..'))
if (-not $TransferDirectory) { $TransferDirectory = Join-Path $moduleRoot 'transfer/v2.8.7-prepilot' }
$transferRoot = [System.IO.Path]::GetFullPath($TransferDirectory)
$requiredStaticFiles = @(
  'COPY_ALLOWLIST.txt', 'FAILED_SANDBOX_RECOVERY_GUIDE_ja.md',
  'PHASE8B_ACCEPTANCE_CHECKLIST_ja.md', 'README_ja.md',
  'RESULTS_TEMPLATE_ja.md', 'STOP_AND_ROLLBACK_CHECKLIST_ja.md',
  'SYNTHETIC_TEST_DATA_SPECIFICATION_ja.md', 'TRANSFER_MANIFEST.md'
)
$generatedFiles = @(
  'COMPANY_PC_PATCH_MANIFEST.json', 'COMPANY_PC_PATCH_MANIFEST_ja.md',
  'TRANSFER_CHECKSUMS.sha256'
)
$safeCompletedStages = @(
  'S00_VALIDATE_ENV', 'S10_CREATE_SHEETS', 'S20_CREATE_SCHEMAS',
  'S30_APPLY_SMALL_VALIDATIONS', 'S40_SEED_SAFE_SETTINGS',
  'S50_CREATE_GMAIL_LABELS', 'S60_CREATE_DEADLINE_CALENDAR',
  'S70_STORE_PROPERTIES', 'S80_CREATE_EDIT_TRIGGER'
)
$safeIncompleteStages = @('S90_QUICK_DIAGNOSTIC', 'S99_COMPLETE')
$manualRepairForbidden = @(
  'Task Authority Ledger', 'Task checkbox values', 'Task/Dashboard protections',
  'Dashboard seed rows', 'Gmail labels', 'Calendar', 'triggers', 'Task data'
)

function Get-GitPath {
  $git = Get-Command -Name git -ErrorAction SilentlyContinue
  if (-not $git) { throw 'Git executable is required for patch manifest verification.' }
  return $git.Path
}
function New-UnicodeString {
  param([int[]]$CodePoints)
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}
function Quote-GitArgument { param([string]$Value) return '"' + $Value.Replace('"', '\"') + '"' }
function Invoke-GitText {
  param([string[]]$Arguments, [string]$Purpose)
  $output = @(& (Get-GitPath) -C $repoRoot @Arguments 2>$null)
  if ($LASTEXITCODE -ne 0) { throw "Git failed for $Purpose." }
  return ($output -join "`n").Trim()
}
function Get-GitBlobSha256 {
  param([string]$BlobSpec)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = Get-GitPath
  $psi.Arguments = '-C ' + (Quote-GitArgument $repoRoot) + ' cat-file blob ' + (Quote-GitArgument $BlobSpec)
  $psi.UseShellExecute = $false; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  $process = New-Object System.Diagnostics.Process; $process.StartInfo = $psi; [void]$process.Start()
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { $bytes = $sha.ComputeHash($process.StandardOutput.BaseStream) } finally { $sha.Dispose() }
  $stderr = $process.StandardError.ReadToEnd(); $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw "Git blob read failed for ${BlobSpec}: $stderr" }
  return ([System.BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}
function Get-PayloadPaths {
  param([string]$Commit, [string]$Root)
  $text = Invoke-GitText -Arguments @('ls-tree', '-r', '--name-only', $Commit, '--', $Root) -Purpose "payload inventory $Commit"
  $prefix = $Root.TrimEnd('/') + '/'
  $paths = @($text -split "`n" | Where-Object { $_ })
  if (-not $paths.Count) { throw "Payload inventory is empty: ${Commit}:$Root" }
  return @($paths | ForEach-Object {
    if (-not $_.StartsWith($prefix)) { throw "Unexpected payload path: $_" }
    $_.Substring($prefix.Length)
  } | Sort-Object)
}
function Get-CanonicalTextSha256 {
  param([string]$Path)
  $text = [System.IO.File]::ReadAllText($Path, [System.Text.UTF8Encoding]::new($false))
  $canonical = $text.Replace("`r`n", "`n").Replace("`r", "`n")
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical))) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

if (-not (Test-Path -LiteralPath $transferRoot -PathType Container)) { throw "Transfer directory does not exist: $transferRoot" }
$actualFiles = @(Get-ChildItem -LiteralPath $transferRoot -File | ForEach-Object { $_.Name } | Sort-Object)
$expectedFiles = @($requiredStaticFiles + $generatedFiles | Sort-Object)
if (($actualFiles -join "`n") -ne ($expectedFiles -join "`n")) { throw 'Transfer file inventory mismatch.' }
if (@(Get-ChildItem -LiteralPath $transferRoot -Directory).Count) { throw 'Transfer envelope must not contain subdirectories.' }

$jsonPath = Join-Path $transferRoot 'COMPANY_PC_PATCH_MANIFEST.json'
$mdPath = Join-Path $transferRoot 'COMPANY_PC_PATCH_MANIFEST_ja.md'
$checksumPath = Join-Path $transferRoot 'TRANSFER_CHECKSUMS.sha256'
$manifest = Get-Content -Raw -Encoding UTF8 -LiteralPath $jsonPath | ConvertFrom-Json
if ($manifest.old_fixed_ref -ne $OldFixedRef -or $manifest.new_payload_commit -ne $NewPayloadCommit) { throw 'Patch manifest ref/commit binding mismatch.' }
if ($manifest.new_fixed_ref -ne 'SELF (the Git commit containing this transfer envelope)') { throw 'Patch manifest must use SELF for its not-yet-known transfer ref.' }
if ($manifest.old_version -ne 'v2.8.6-prepilot' -or $manifest.new_version -ne 'v2.8.7-prepilot') { throw 'Patch manifest version binding mismatch.' }
if ($manifest.old_payload_root -ne $oldPayloadRoot -or $manifest.new_payload_root -ne $newPayloadRoot) { throw 'Patch manifest payload-root binding mismatch.' }
if ($manifest.comparison_method -ne 'git_blob_raw_bytes_sha256') { throw 'Patch manifest must compare raw Git blobs.' }

$oldPaths = Get-PayloadPaths -Commit $OldFixedRef -Root $oldPayloadRoot
$newPaths = Get-PayloadPaths -Commit $NewPayloadCommit -Root $newPayloadRoot
$allPaths = @(@($oldPaths + $newPaths) | Sort-Object -Unique)
$expected = @{}
$expectedUnchanged = @()
foreach ($relativePath in $allPaths) {
  $oldPresent = $oldPaths -contains $relativePath; $newPresent = $newPaths -contains $relativePath
  $oldHash = if ($oldPresent) { Get-GitBlobSha256 "${OldFixedRef}:$oldPayloadRoot/$relativePath" } else { $null }
  $newHash = if ($newPresent) { Get-GitBlobSha256 "${NewPayloadCommit}:$newPayloadRoot/$relativePath" } else { $null }
  if ($oldPresent -and $newPresent -and $oldHash -eq $newHash) { $expectedUnchanged += $relativePath; continue }
  $changeType = if (-not $oldPresent) { 'added' } elseif (-not $newPresent) { 'removed' } else { 'modified' }
  $expected[$relativePath] = "$changeType|$oldHash|$newHash"
}
$actual = @{}
foreach ($item in @($manifest.changed_payload_files)) {
  if (-not @('added', 'modified', 'removed').Contains([string]$item.change_type)) { throw "Invalid change_type: $($item.change_type)" }
  if ($actual.ContainsKey($item.path)) { throw "Duplicate manifest payload path: $($item.path)" }
  $actual[$item.path] = "$($item.change_type)|$($item.old_sha256)|$($item.new_sha256)"
}
if ($expected.Count -ne $actual.Count) { throw 'Changed payload count mismatch.' }
foreach ($path in $expected.Keys) {
  if (-not $actual.ContainsKey($path) -or $actual[$path] -ne $expected[$path]) { throw "Raw-byte patch record mismatch: $path" }
}
$expectedUnchanged = @($expectedUnchanged | Sort-Object)
if ((@(@($manifest.unchanged_payload_files) | Sort-Object) -join "`n") -ne ($expectedUnchanged -join "`n")) { throw 'Unchanged payload file list mismatch.' }
if ([int]$manifest.unchanged_payload_file_count -ne $expectedUnchanged.Count) { throw 'Unchanged payload count mismatch.' }
$manifestChanged = $expected.ContainsKey('appsscript.json')
if ([bool]$manifest.appsscript_manifest_changed -ne $manifestChanged) { throw 'appsscript.json change flag mismatch.' }

$priority = @{'00_Config.gs'=10;'01_TypesAndSchemas.gs'=20;'02_Setup.gs'=30;'03_SheetBuilder.gs'=40;'15_Dashboard.gs'=50;'16_Diagnostics.gs'=60;'99_TestHarness.gs'=90;'appsscript.json'=100}
$expectedOrder = @($expected.Keys | Where-Object { -not $expected[$_].StartsWith('removed|') } | Sort-Object @{ Expression = { if ($priority.ContainsKey($_)) { $priority[$_] } else { 70 } } }, @{ Expression = { $_ } })
if ((@($manifest.replacement_order) -join "`n") -ne ($expectedOrder -join "`n")) { throw 'Replacement order mismatch or contains a removed file.' }
$expectedRemoved = @($expected.Keys | Where-Object { $expected[$_].StartsWith('removed|') } | Sort-Object)
if ((@(@($manifest.removed_payload_files) | Sort-Object) -join "`n") -ne ($expectedRemoved -join "`n")) { throw 'Removed payload list mismatch.' }

$config = $manifest.expected_post_update_config
if ($config.code_version -ne '2.8.7-prepilot' -or $config.schema_version -ne '2.6' -or $config.ai_schema_version -ne '2.0' -or $config.migration_version -ne '3' -or [bool]$config.test_mode -ne $true -or [bool]$config.automation_enabled -ne $false) { throw 'Expected post-update configuration mismatch.' }
if ((@($manifest.safe_resume_stage.completed) -join "`n") -ne ($safeCompletedStages -join "`n") -or (@($manifest.safe_resume_stage.incomplete) -join "`n") -ne ($safeIncompleteStages -join "`n")) { throw 'Safe resume stage contract mismatch.' }
if ([bool]$manifest.automation_enabled -ne $false -or $manifest.real_workspace_retest -ne 'NOT_EXECUTED') { throw 'Automation/retest safety binding mismatch.' }
if ((@(@($manifest.manual_repair_forbidden) | Sort-Object) -join "`n") -ne (@($manualRepairForbidden | Sort-Object) -join "`n")) { throw 'Manual-repair prohibition mismatch.' }

$companyReplacementHeading = New-UnicodeString @(0x4F1A,0x793E,0x0050,0x0043,0x3067,0x5DEE,0x3057,0x66FF,0x3048,0x308B,0x30D5,0x30A1,0x30A4,0x30EB)
$unchangedHeading = New-UnicodeString @(0x5909,0x66F4,0x4E0D,0x8981,0x30D5,0x30A1,0x30A4,0x30EB)
$manualRepairText = New-UnicodeString @(0x624B,0x52D5,0x4FEE,0x5FA9)
$md = Get-Content -Raw -Encoding UTF8 -LiteralPath $mdPath
foreach ($literal in @($companyReplacementHeading, $unchangedHeading, 'CODE_VERSION=2.8.7-prepilot', 'TEST_MODE=true', 'AUTOMATION_ENABLED=false', 'S00-S80', 'S90/S99', 'old SHA-256', 'new SHA-256', $manualRepairText)) {
  if (-not $md.Contains($literal)) { throw "Required patch-manifest instruction is missing: $literal" }
}

$checksumRecords = @{}
foreach ($line in Get-Content -LiteralPath $checksumPath -Encoding UTF8) {
  if (-not $line) { continue }
  $match = [regex]::Match($line, '^(?<hash>[0-9a-f]{64})  (?<name>[^\\/]+)$')
  if (-not $match.Success -or $match.Groups['name'].Value -eq 'TRANSFER_CHECKSUMS.sha256') { throw "Invalid transfer checksum record: $line" }
  if ($checksumRecords.ContainsKey($match.Groups['name'].Value)) { throw "Duplicate transfer checksum record: $line" }
  $checksumRecords[$match.Groups['name'].Value] = $match.Groups['hash'].Value
}
$checksumNames = @($actualFiles | Where-Object { $_ -ne 'TRANSFER_CHECKSUMS.sha256' })
if ((@($checksumRecords.Keys | Sort-Object) -join "`n") -ne (@($checksumNames | Sort-Object) -join "`n")) { throw 'Transfer checksum inventory mismatch.' }
foreach ($name in $checksumNames) {
  if ((Get-CanonicalTextSha256 -Path (Join-Path $transferRoot $name)) -ne $checksumRecords[$name]) { throw "Transfer canonical checksum mismatch: $name" }
}

[pscustomobject]@{
  OldFixedRef = $OldFixedRef
  NewPayloadCommit = $NewPayloadCommit
  ChangedPayloadFiles = $expected.Count
  UnchangedPayloadFiles = $expectedUnchanged.Count
  AppsscriptManifestChanged = $manifestChanged
  RawBlobParity = 'PASS'
  TransferChecksums = 'PASS'
  ResumeContract = 'PASS'
  AutomationDefault = 'OFF'
  RealWorkspaceRetest = 'NOT_EXECUTED'
} | Format-List
