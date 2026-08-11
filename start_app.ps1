$ErrorActionPreference = "Stop"

function Test-CommandExists {
  param([string]$CommandName)

  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "uv")) {
  Write-Error "Missing required command: uv"
}

if (-not (Test-CommandExists "pnpm") -and -not (Test-CommandExists "npm") -and -not (Test-CommandExists "npx")) {
  Write-Error "Missing required package manager (pnpm, npm, or npx)"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start each service in its own PowerShell window so logs remain visible.
if (Test-CommandExists "livekit-server") {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; livekit-server --dev"
} else {
  Write-Warning "livekit-server was not found. Skipping local LiveKit startup and using your configured LIVEKIT_URL instead."
}

Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$repoRoot\backend'; uv run python src/agent.py dev"
Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$repoRoot\frontend'; cmd /c npm run dev"

Write-Host "Started backend and frontend in separate PowerShell windows."
Write-Host ""
Write-Host "IMPORTANT: Please wait ~30 seconds for the backend PowerShell window to display 'registered worker' before clicking 'Start Call' at http://localhost:3000!" -ForegroundColor Yellow
