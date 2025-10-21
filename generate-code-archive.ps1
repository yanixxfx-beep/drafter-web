# PowerShell script to generate complete code archive for ChatGPT
# Run this script to create a comprehensive code listing

Write-Host "🤖 Generating Complete Code Archive for ChatGPT..." -ForegroundColor Green

$outputFile = "COMPLETE_SOURCE_CODE.md"
$excludePatterns = @("node_modules", ".next", ".git", "dist", "build", "*.log")

Write-Host "📁 Scanning source files..." -ForegroundColor Yellow

# Get all source files
$sourceFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts", "*.js", "*.json" | Where-Object {
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.FullName -like "*$pattern*") {
            $exclude = $true
            break
        }
    }
    return -not $exclude
}

Write-Host "📝 Found $($sourceFiles.Count) source files" -ForegroundColor Green

# Create output file
$content = @"
# 🤖 Complete Drafter App Source Code

## 📋 Repository Information
- **GitHub**: https://github.com/yanixxfx-beep/drafter-web
- **Framework**: React 18 + Next.js 14 + TypeScript
- **Status**: Fully functional and ready for analysis

---

"@

foreach ($file in $sourceFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "📄 Processing: $relativePath" -ForegroundColor Cyan
    
    $content += "`n## 📄 $relativePath`n`n"
    $content += "```typescript`n"
    
    try {
        $fileContent = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $content += $fileContent
    } catch {
        $content += "Error reading file: $($_.Exception.Message)"
    }
    
    $content += "`n```\n"
}

# Add configuration files
$configFiles = @("package.json", "next.config.js", "tsconfig.json", "tailwind.config.js")
foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        $content += "`n## 📄 $configFile`n`n"
        $content += "```json`n"
        try {
            $fileContent = Get-Content -Path $configFile -Raw -Encoding UTF8
            $content += $fileContent
        } catch {
            $content += "Error reading file: $($_.Exception.Message)"
        }
        $content += "`n```\n"
    }
}

# Write to file
$content | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✅ Complete code archive generated: $outputFile" -ForegroundColor Green
Write-Host "📊 Total files processed: $($sourceFiles.Count)" -ForegroundColor Green
Write-Host "📏 File size: $((Get-Item $outputFile).Length / 1MB) MB" -ForegroundColor Green
Write-Host "`n🚀 Ready to share with ChatGPT!" -ForegroundColor Green

