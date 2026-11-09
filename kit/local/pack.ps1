# How It Really Works - make a slim, portable copy of this folder (to move to another PC / Claude account).
# Leaves out everything that is rebuilt on the new PC (Python envs, node_modules, models) and the render frames.
# Result: a folder next to this one, "HowItReallyWorks-portable", usually well under 1 GB.
$Src = $PSScriptRoot
$Dst = Join-Path (Split-Path $Src -Parent) 'HowItReallyWorks-portable'
Write-Host "Making a portable copy in: $Dst" -ForegroundColor Cyan
if (Test-Path $Dst) { Remove-Item $Dst -Recurse -Force }
New-Item -ItemType Directory -Force $Dst | Out-Null

# 1) everything except the heavy / machine-specific folders
robocopy $Src $Dst /E /NFL /NDL /NJH /NP `
  /XD "$Src\py" "$Src\pycb" "$Src\hyperframes" "$Src\models" "$Src\out" "$Src\logs" "$Src\jobs" node_modules __pycache__ .cache | Out-Null

# 2) empty working folders the runner expects
foreach ($d in 'jobs', 'jobs\done', 'logs', 'out', 'in') { New-Item -ItemType Directory -Force (Join-Path $Dst $d) | Out-Null }

# 3) keep only the finished videos from out\ (not the frame folders)
Get-ChildItem "$Src\out\*.mp4" -ErrorAction SilentlyContinue | Copy-Item -Destination "$Dst\out\"

$mb = [math]::Round(((Get-ChildItem $Dst -Recurse -File | Measure-Object Length -Sum).Sum) / 1MB)
Write-Host ""
Write-Host "Done: $Dst  ($mb MB)" -ForegroundColor Green
Write-Host "Copy THAT folder to the new PC (rename it HowItReallyWorks if you like)."
Write-Host "On the new PC: run 1-SETUP, start the runner, connect the folder in the Claude desktop app,"
Write-Host "and tell Claude: Read '00-START HERE (for Claude).md' and continue (it will run the 'tools' job to rebuild the rest)."
Read-Host "Press Enter to close"
