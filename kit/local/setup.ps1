# How It Really Works - one-time setup on this PC (free tools only).
# Installs Git, Node.js LTS, Python 3.12 and FFmpeg with winget, downloads the studio repo,
# makes Microsoft Edge use the NVIDIA GPU, and runs a GPU speed test. Log: logs\setup.log
$ErrorActionPreference = 'Continue'
$Root = $PSScriptRoot
New-Item -ItemType Directory -Force "$Root\logs", "$Root\jobs", "$Root\jobs\done", "$Root\out" | Out-Null
Start-Transcript -Path "$Root\logs\setup.log" -Force | Out-Null
Write-Host "`n== How It Really Works: setup ==`n" -ForegroundColor Cyan

foreach ($p in @('Git.Git', 'OpenJS.NodeJS.LTS', 'Python.Python.3.12', 'Gyan.FFmpeg')) {
  Write-Host "Installing $p ..." -ForegroundColor Yellow
  winget install --id $p -e --silent --accept-package-agreements --accept-source-agreements
}
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')

# Windows graphics preference: Edge on the high-performance GPU (NVIDIA)
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
New-Item -Path 'HKCU:\Software\Microsoft\DirectX\UserGpuPreferences' -Force | Out-Null
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\DirectX\UserGpuPreferences' -Name $edge -Value 'GpuPreference=2;'

# Studio repo (public)
if (Test-Path "$Root\studio\.git") { git -C "$Root\studio" pull } else { git clone https://github.com/seifmannai/claude-explainer-studio "$Root\studio" }
npm install --prefix "$Root\studio\kit\local"
npm install --prefix "$Root\studio\videos\combustion-engine\web" three@0.170.0 --no-save

Write-Host "`nGPU speed test (a browser window will open and close by itself) ..." -ForegroundColor Yellow
node "$Root\studio\kit\local\local_render.mjs" speedtest "$Root\studio" "videos/combustion-engine/web/index.html" "$Root\out\speedtest" 30

Write-Host "`nVersions:" -ForegroundColor Cyan
git --version; node --version; python --version; (ffmpeg -version | Select-Object -First 1)
Stop-Transcript | Out-Null
Write-Host "`nSetup finished. Tell Claude 'setup done'." -ForegroundColor Green
Read-Host "Press Enter to close"
