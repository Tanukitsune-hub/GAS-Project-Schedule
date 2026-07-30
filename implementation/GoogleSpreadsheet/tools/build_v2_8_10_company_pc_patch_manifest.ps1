[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$NewPayloadCommit,
  [ValidatePattern('^[0-9a-f]{40}$')]
  [string]$OldFixedRef = '781f408fcf0853a5fffee9c00d3022ee5e17b1d7',
  [string]$OutputDirectory = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$oldVersion = 'v2.8.9-prepilot'
$newVersion = 'v2.8.10-prepilot'
$oldPayloadRoot = 'implementation/GoogleSpreadsheet/release/v2.8.9-prepilot/apps-script'
$newPayloadRoot = 'implementation/GoogleSpreadsheet/release/v2.8.10-prepilot/apps-script'
$newFixedRef = 'SELF (the Git commit containing this transfer envelope)'
$moduleRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $moduleRoot '../..'))
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $moduleRoot 'transfer/v2.8.10-prepilot' }
$outputRoot = [System.IO.Path]::GetFullPath($OutputDirectory)

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

function New-UnicodeString {
  param([int[]]$CodePoints)
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}
function Write-Utf8NoBom {
  param([string]$Path, [string]$Content)
  [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}
function Get-CanonicalTextSha256 {
  param([string]$Path)
  $text = [System.IO.File]::ReadAllText($Path, [System.Text.UTF8Encoding]::new($false))
  $canonical = $text.Replace("`r`n", "`n").Replace("`r", "`n")
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { return ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical))) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}
function Get-GitPath {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) { throw 'Git executable is required for raw-blob patch comparison.' }
  return $git.Path
}
function Quote-GitArgument { param([string]$Value) return '"' + $Value.Replace('"', '\"') + '"' }
function Invoke-GitText {
  param([string[]]$Arguments, [string]$Purpose)
  $output = @(& (Get-GitPath) -C $repoRoot @Arguments 2>$null)
  if ($LASTEXITCODE -ne 0) { throw "Git failed for $Purpose." }
  return ($output -join "`n").Trim()
}
function Assert-GitCommit {
  param([string]$Commit, [string]$Label)
  $resolved = Invoke-GitText @('rev-parse', '--verify', "${Commit}^{commit}") $Label
  if ($resolved.ToLowerInvariant() -ne $Commit.ToLowerInvariant()) { throw "$Label did not resolve to the supplied immutable commit." }
}
function Get-GitBlobSha256 {
  param([string]$BlobSpec)
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = Get-GitPath
  $psi.Arguments = '-C ' + (Quote-GitArgument $repoRoot) + ' cat-file blob ' + (Quote-GitArgument $BlobSpec)
  $psi.UseShellExecute = $false; $psi.RedirectStandardOutput = $true; $psi.RedirectStandardError = $true
  $process = New-Object System.Diagnostics.Process; $process.StartInfo = $psi; [void]$process.Start()
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try { $hashBytes = $sha.ComputeHash($process.StandardOutput.BaseStream) } finally { $sha.Dispose() }
  $stderr = $process.StandardError.ReadToEnd(); $process.WaitForExit()
  if ($process.ExitCode -ne 0) { throw "Git blob read failed for ${BlobSpec}: $stderr" }
  return ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
}
function Get-PayloadPaths {
  param([string]$Commit, [string]$Root)
  $text = Invoke-GitText @('ls-tree', '-r', '--name-only', $Commit, '--', $Root) "payload inventory $Commit"
  $prefix = $Root.TrimEnd('/') + '/'
  $paths = @($text -split "`n" | Where-Object { $_ })
  if (-not $paths.Count) { throw "Payload inventory is empty: ${Commit}:$Root" }
  return @($paths | ForEach-Object {
    if (-not $_.StartsWith($prefix)) { throw "Unexpected payload path: $_" }
    $_.Substring($prefix.Length)
  } | Sort-Object)
}
function Assert-TransferAssemblyInput {
  if (-not (Test-Path -LiteralPath $outputRoot)) { New-Item -ItemType Directory -Path $outputRoot | Out-Null }
  if (-not (Get-Item -LiteralPath $outputRoot -Force).PSIsContainer) { throw "Output path is not a directory: $outputRoot" }
  $children = @(Get-ChildItem -LiteralPath $outputRoot -Force)
  if (@($children | Where-Object { $_.PSIsContainer }).Count) { throw 'Transfer envelope must not contain subdirectories.' }
  $allowed = @($requiredStaticFiles + $generatedFiles)
  foreach ($child in $children) { if ($allowed -notcontains $child.Name) { throw "Unknown pre-existing transfer file: $($child.Name)" } }
  foreach ($name in $requiredStaticFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $outputRoot $name) -PathType Leaf)) { throw "Required static transfer document is missing: $name" }
  }
}

Assert-GitCommit $OldFixedRef 'OldFixedRef'
Assert-GitCommit $NewPayloadCommit 'NewPayloadCommit'
Assert-TransferAssemblyInput
$oldPaths = Get-PayloadPaths $OldFixedRef $oldPayloadRoot
$newPaths = Get-PayloadPaths $NewPayloadCommit $newPayloadRoot
$allPaths = @(@($oldPaths + $newPaths) | Sort-Object -Unique)
$changes = @(); $unchangedPaths = @()
foreach ($relativePath in $allPaths) {
  $oldPresent = $oldPaths -contains $relativePath; $newPresent = $newPaths -contains $relativePath
  $oldHash = if ($oldPresent) { Get-GitBlobSha256 "${OldFixedRef}:$oldPayloadRoot/$relativePath" } else { $null }
  $newHash = if ($newPresent) { Get-GitBlobSha256 "${NewPayloadCommit}:$newPayloadRoot/$relativePath" } else { $null }
  if ($oldPresent -and $newPresent -and $oldHash -eq $newHash) { $unchangedPaths += $relativePath; continue }
  $changeType = if (-not $oldPresent) { 'added' } elseif (-not $newPresent) { 'removed' } else { 'modified' }
  $changes += [pscustomobject]@{ path=$relativePath; change_type=$changeType; old_sha256=$oldHash; new_sha256=$newHash }
}
$changes = @($changes | Sort-Object path); $unchangedPaths = @($unchangedPaths | Sort-Object)
$priority = @{'00_Config.gs'=10;'01_TypesAndSchemas.gs'=20;'02_Setup.gs'=30;'03_SheetBuilder.gs'=40;'15_Dashboard.gs'=50;'16_Diagnostics.gs'=60;'99_TestHarness.gs'=90;'appsscript.json'=100}
$replacementOrder = @($changes | Where-Object { $_.change_type -ne 'removed' } | Sort-Object @{Expression={if($priority.ContainsKey($_.path)){$priority[$_.path]}else{70}}},path | ForEach-Object { $_.path })
$removedPayloadFiles = @($changes | Where-Object { $_.change_type -eq 'removed' } | ForEach-Object { $_.path })
$expectedConfig = [ordered]@{code_version='2.8.10-prepilot';schema_version='2.6';ai_schema_version='2.0';migration_version='3';test_mode=$true;automation_enabled=$false}
$manifest = [ordered]@{
  manifest_version=1; old_fixed_ref=$OldFixedRef; new_fixed_ref=$newFixedRef; new_payload_commit=$NewPayloadCommit
  old_version=$oldVersion; new_version=$newVersion; old_payload_root=$oldPayloadRoot; new_payload_root=$newPayloadRoot
  comparison_method='git_blob_raw_bytes_sha256'; changed_payload_files=@($changes); unchanged_payload_files=@($unchangedPaths)
  unchanged_payload_file_count=$unchangedPaths.Count; appsscript_manifest_changed=[bool]($changes | Where-Object {$_.path -eq 'appsscript.json'})
  replacement_order=@($replacementOrder); removed_payload_files=@($removedPayloadFiles); expected_post_update_config=$expectedConfig
  safe_resume_stage=[ordered]@{completed=@($safeCompletedStages);incomplete=@($safeIncompleteStages)}
  automation_enabled=$false; real_workspace_retest='NOT_EXECUTED'; manual_repair_forbidden=@($manualRepairForbidden)
}
$jsonPath = Join-Path $outputRoot 'COMPANY_PC_PATCH_MANIFEST.json'
Write-Utf8NoBom $jsonPath (($manifest | ConvertTo-Json -Depth 8) + "`n")
$changeRows = if ($changes.Count) { ($changes | ForEach-Object { $old=if($_.old_sha256){$_.old_sha256}else{'N/A'}; $new=if($_.new_sha256){$_.new_sha256}else{'N/A'}; "| $($_.path) | $($_.change_type) | $old | $new |" }) -join "`n" } else { '| None | none | N/A | N/A |' }
$unchangedRows = if ($unchangedPaths.Count) { ($unchangedPaths | ForEach-Object { "- $_" }) -join "`n" } else { '- None' }
$orderRows = if ($replacementOrder.Count) { ($replacementOrder | ForEach-Object -Begin {$index=0} -Process {$index+=1;"$index. $_"}) -join "`n" } else { 'No added or modified payload file replacement is required.' }
$removedRows = if ($removedPayloadFiles.Count) { ($removedPayloadFiles | ForEach-Object { "- $_ (manual review required; do not delete automatically)" }) -join "`n" } else { '- None' }
$companyReplacementHeading = '## ' + (New-UnicodeString @(0x4F1A,0x793E,0x0050,0x0043,0x3067,0x5DEE,0x3057,0x66FF,0x3048,0x308B,0x30D5,0x30A1,0x30A4,0x30EB))
$unchangedHeading = '## ' + (New-UnicodeString @(0x5909,0x66F4,0x4E0D,0x8981,0x30D5,0x30A1,0x30A4,0x30EB))
$manualRepairText = New-UnicodeString @(0x624B,0x52D5,0x4FEE,0x5FA9)
$mdLines = @(
  '# Company-PC Patch Manifest - v2.8.10-prepilot','',
  'Generated from a raw Git blob byte comparison between fixed T9 v2.8.9-prepilot payload and Release B10 v2.8.10-prepilot payload.','',
  '| Field | Value |','|---|---|',"| Old fixed ref | $OldFixedRef |","| New fixed ref | $newFixedRef |","| New payload commit | $NewPayloadCommit |",'| Comparison | git_blob_raw_bytes_sha256 |',"| appsscript.json changed | $($manifest.appsscript_manifest_changed) |","| Unchanged payload file count | $($unchangedPaths.Count) |",'| Automation default | OFF |','| Real Workspace retest | NOT_EXECUTED |','',
  $companyReplacementHeading,'','| Path | Change type | Old SHA-256 | New SHA-256 |','|---|---|---|---|',$changeRows,'',
  $unchangedHeading,'',$unchangedRows,'','Files not listed for replacement are byte-identical between old and new payloads. Preserve them without replacement.','',
  '## Removed payload files','',$removedRows,'','Do not delete a removed file automatically. Stop for separate approval and safety review.','',
  '## Replacement order','',$orderRows,'','Before replacement, confirm each company-PC file matches its old SHA-256. If it does not, stop. After replacement, confirm the new SHA-256. If it cannot be confirmed, stop.','',
  '## Post-update configuration checks','','- CODE_VERSION=2.8.10-prepilot','- SCHEMA_VERSION=2.6','- AI_SCHEMA_VERSION=2.0','- MIGRATION_VERSION=3','- TEST_MODE=true','- AUTOMATION_ENABLED=false','',
  '## Safe resume from S00-S80','', 'Treat the Sandbox as S00-S80 complete and S90/S99 incomplete. With separately granted execution authority only, revalidate S00-S80 and resume S90 Quick Diagnostic then S99.','Do not duplicate, delete, overwrite, or manually repair Gmail labels, the dedicated Calendar, Properties, the owner edit trigger, Task Authority Ledger, Task data, or Dashboard seed. Automation stays OFF and no five-minute trigger is created. If S90 is FAIL, leave S90/S99 incomplete and stop.','',
  '## Stop / rollback','', "Stop on old hash mismatch, unconfirmed new hash, manifest mismatch, or a genuine Quick Diagnostic FAIL including a Dashboard surface conflict. $manualRepairText of Sheet, checkbox, Protection, Dashboard, Ledger, Gmail label, Calendar, trigger, or Task data is forbidden. A rollback requires a separately approved verified-old-payload procedure. This manifest does not declare real Workspace retest PASS."
)
Write-Utf8NoBom (Join-Path $outputRoot 'COMPANY_PC_PATCH_MANIFEST_ja.md') ($mdLines -join "`n")
$checksumFiles = @(Get-ChildItem -LiteralPath $outputRoot -File | Where-Object {$_.Name -ne 'TRANSFER_CHECKSUMS.sha256'} | Sort-Object Name)
$checksum = ($checksumFiles | ForEach-Object { "$(Get-CanonicalTextSha256 $_.FullName)  $($_.Name)" }) -join "`n"
Write-Utf8NoBom (Join-Path $outputRoot 'TRANSFER_CHECKSUMS.sha256') ($checksum + "`n")
[pscustomobject]@{OldFixedRef=$OldFixedRef;NewPayloadCommit=$NewPayloadCommit;ChangedPayloadFiles=$changes.Count;UnchangedPayloadFiles=$unchangedPaths.Count;AppsscriptManifestChanged=$manifest.appsscript_manifest_changed;TransferFiles=$checksumFiles.Count;Comparison='git_blob_raw_bytes_sha256'} | Format-List
