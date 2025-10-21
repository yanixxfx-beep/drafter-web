# PowerShell script to watch for processes that bind to port 3000
$port = 3000
Write-Host "Watching for LISTEN on TCP $port..."
Write-Host "Now run 'npm run dev' in another terminal..."
Write-Host ""

while ($true) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    $ownerProcId = $conn.OwningProcess
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerProcId"
    
    Write-Host "=== PORT $port GRABBED ===" -ForegroundColor Red
    Write-Host "Time: $(Get-Date)"
    Write-Host "Process ID: $($proc.ProcessId)"
    Write-Host "Name: $($proc.Name)"
    Write-Host "Executable: $($proc.ExecutablePath)"
    Write-Host "Command Line: $($proc.CommandLine)"
    Write-Host ""
    
    break
  }
  Start-Sleep -Milliseconds 100
}






