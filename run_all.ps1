Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   LUNA NAV - LUNAR SOUTH POLE LANDING SITE INTELLIGENCE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$backendScript = "$PSScriptRoot\run_backend.ps1"
$frontendScript = "$PSScriptRoot\run_frontend.ps1"

Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$backendScript`""
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$frontendScript`""

Write-Host "FastAPI Backend launched on http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "React Frontend launched on http://localhost:5173" -ForegroundColor Green
Write-Host "API Interactive Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
