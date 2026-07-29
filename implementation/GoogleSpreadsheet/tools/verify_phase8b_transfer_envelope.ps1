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

function Assert-TransferContentSafety {
  param([Parameter(Mandatory = $true)][string[]]$Paths)

  # Operator documents may state that secrets, Workspace IDs, or local paths are
  # forbidden. Match only value-shaped secrets and actual path/URL forms so the
  # safety instructions themselves do not produce a false positive.
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

  foreach ($path in $Paths) {
    $content = Get-Content -Raw -Encoding UTF8 -LiteralPath $path
    if ($prohibitedContent.IsMatch($content)) {
      throw "Transfer secret/local-path scan failed: $([System.IO.Path]::GetFileName($path))"
    }
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

Assert-TransferContentSafety -Paths @(
  $actualNames | ForEach-Object { Join-Path $transferRoot $_ }
)

[pscustomobject]@{
  TransferDirectory = $transferRoot
  TransferFiles = $actualNames.Count
  CanonicalTextSha256 = 'PASS'
  ChecksumFileSelfIncluded = $false
  SecretAndLocalPathScan = 'PASS'
}
