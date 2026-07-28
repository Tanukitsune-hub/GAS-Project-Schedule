[CmdletBinding()]
param(
  [string]$TransferDirectory = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not $TransferDirectory) {
  $TransferDirectory = Join-Path $PSScriptRoot '..\transfer\v2.8.5-prepilot'
}
$transferRoot = [System.IO.Path]::GetFullPath($TransferDirectory)
$checksumPath = Join-Path $transferRoot 'TRANSFER_CHECKSUMS.sha256'

function Get-CanonicalTextSha256 {
  param([Parameter(Mandatory = $true)][string]$Path)

  $text = [System.IO.File]::ReadAllText(
    $Path,
    [System.Text.UTF8Encoding]::new($false)
  )
  # Git checkouts may use LF or CRLF. The operator-documentation digest is
  # intentionally over portable UTF-8 text, not checkout-specific bytes.
  $canonical = $text.Replace("`r`n", "`n").Replace("`r", "`n")
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($canonical)
    return ([System.BitConverter]::ToString(
      $sha.ComputeHash($bytes)
    ) -replace '-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

if (-not (Test-Path -LiteralPath $transferRoot -PathType Container)) {
  throw "Transfer directory does not exist: $transferRoot"
}
if (-not (Test-Path -LiteralPath $checksumPath -PathType Leaf)) {
  throw 'TRANSFER_CHECKSUMS.sha256 is required.'
}

$records = @{}
foreach ($line in Get-Content -LiteralPath $checksumPath -Encoding UTF8) {
  if (-not $line) {
    continue
  }
  $match = [regex]::Match($line, '^(?<hash>[0-9a-f]{64})  (?<name>[^\\/]+)$')
  if (-not $match.Success) {
    throw "Invalid transfer checksum record: $line"
  }
  $name = $match.Groups['name'].Value
  if ($name -eq 'TRANSFER_CHECKSUMS.sha256') {
    throw 'TRANSFER_CHECKSUMS.sha256 must not self-include.'
  }
  if ($records.ContainsKey($name)) {
    throw "Duplicate transfer checksum record: $name"
  }
  $records[$name] = $match.Groups['hash'].Value
}

$expectedNames = @(
  Get-ChildItem -LiteralPath $transferRoot -File |
    Where-Object { $_.Name -ne 'TRANSFER_CHECKSUMS.sha256' } |
    ForEach-Object { $_.Name } |
    Sort-Object
)
$actualNames = @($records.Keys | Sort-Object)
if (($expectedNames -join "`n") -ne ($actualNames -join "`n")) {
  throw 'Transfer checksum inventory does not exactly match non-self files.'
}

foreach ($name in $actualNames) {
  $path = Join-Path $transferRoot $name
  $actual = Get-CanonicalTextSha256 -Path $path
  if ($actual -ne $records[$name]) {
    throw "Canonical transfer checksum mismatch: $name"
  }
}

[pscustomobject]@{
  TransferDirectory = $transferRoot
  TransferFiles = $actualNames.Count
  CanonicalTextSha256 = 'PASS'
  ChecksumFileSelfIncluded = $false
}
