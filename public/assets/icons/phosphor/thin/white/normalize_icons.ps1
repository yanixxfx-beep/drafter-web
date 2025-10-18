Param(
  [string]$Dir = "D:\Saas\Drafter\assets\icons\phosphor\thin",
  [string]$StrokeWidth = "1.5"
)

Get-ChildItem -LiteralPath $Dir -Filter *.svg | ForEach-Object {
  $c = Get-Content -LiteralPath $_.FullName -Raw
  $c = $c -replace 'stroke="#[0-9A-Fa-f]{3,6}"','stroke="currentColor"'
  $c = $c -replace 'fill="#[0-9A-Fa-f]{3,6}"','fill="none"'
  if ($c -match 'stroke-width="[^"]+"') {
    $c = $c -replace 'stroke-width="[^"]+"',"stroke-width=""$StrokeWidth"""
  } else {
    $c = $c -replace '<svg ', "<svg stroke-width=""$StrokeWidth"" "
  }
  Set-Content -LiteralPath $_.FullName -Value $c -Encoding UTF8
}
Write-Host "Normalized SVGs in $Dir"
