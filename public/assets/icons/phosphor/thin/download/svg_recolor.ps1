# svg_recolor.ps1
param(
  [Parameter(Mandatory=$true)][string]$Root,             # folder containing .svg
  [Parameter(Mandatory=$true)][string]$Color,            # e.g. "#7F16D4"
  [switch]$AlsoFill,                                     # optional: recolor fill too
  [switch]$Recurse = $true,                              # include subfolders
  [switch]$Backup = $true                                # write .bak once per file
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Root)) {
  throw "Folder not found: $Root"
}

# Normalize hex like "#7F16D4"
$Color = ($Color.Trim()).ToUpper()
if ($Color -notmatch '^#([0-9A-F]{6}|[0-9A-F]{3})$') {
  throw "Color must be a hex like #7F16D4 or #FFF."
}

$files = Get-ChildItem -LiteralPath $Root -Filter *.svg -Recurse:$Recurse
if (-not $files) { Write-Host "No SVGs found under $Root"; exit }

foreach ($f in $files) {
  $svg = Get-Content -LiteralPath $f.FullName -Raw

  # Optional one-time backup
  if ($Backup) {
    $bak = "$($f.FullName).bak"
    if (-not (Test-Path $bak)) { Copy-Item -LiteralPath $f.FullName -Destination $bak }
  }

  # Replace stroke color in style blocks or style="...":
  $svg = [Regex]::Replace($svg,
    '(?i)(stroke\s*:\s*)(#[0-9a-f]{3,8}|rgb\([^)]+\)|currentColor)',
    "`$1$Color")

  # Replace stroke="#xxxxxx" (but keep stroke="none" intact)
  $svg = [Regex]::Replace($svg,
    '(?i)stroke="(?!none)[^"]*"',
    "stroke=""$Color""")

  if ($AlsoFill) {
    # Replace fill color in style blocks
    $svg = [Regex]::Replace($svg,
      '(?i)(fill\s*:\s*)(#[0-9a-f]{3,8}|rgb\([^)]+\)|currentColor)(?=;|")',
      "`$1$Color")
    # Replace fill attr (but keep fill="none")
    $svg = [Regex]::Replace($svg,
      '(?i)fill="(?!none)[^"]*"',
      "fill=""$Color""")
  }

  # Write back (UTF-8)
  Set-Content -LiteralPath $f.FullName -Value $svg -Encoding UTF8
}

Write-Host "Recolored $($files.Count) SVG(s) in $Root to $Color. AlsoFill=$AlsoFill"
