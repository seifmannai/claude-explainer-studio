# One job = the whole video on the PC, so Claude does not have to drive each step (saves credits).
# Called by runner.ps1 for {"action":"make", ...} after it has reset the studio to GitHub's latest version.
# Job fields:
#   slug   videos/<slug>            (required)
#   name   output name, e.g. engine_v2   (required)
#   voice  in/<file>.wav            (required for words/audio)
#   steps  comma list, default "words,audio,render,encode"
#   scale  1..2 (default 2)
#   page   default web/short.html
# Writes everything to out\<name>\ : STATUS.txt (one line per step, last line DONE or FAILED),
#   words.json, final.wav, <name>.mp4 (full quality, for upload), preview.mp4 (small, for Claude QA), sheet.jpg.
param([string]$Root, [string]$JobFile)
$ErrorActionPreference = 'Continue'
$Studio = "$Root\studio"; $py = "$Root\py\Scripts\python.exe"
$Safe = '^[A-Za-z0-9_\-./]+$'
function Ok($v) { return ($v -is [string]) -and ($v -match $Safe) -and ($v -notmatch '\.\.') }
$job = Get-Content $JobFile -Raw | ConvertFrom-Json
if (-not ((Ok $job.slug) -and (Ok $job.name))) { 'rejected: slug/name'; exit 1 }
$vid = "$Studio\videos\$($job.slug)"; $aud = "$vid\audio"; $out = "$Root\out\$($job.name)"
$page = "videos/$($job.slug)/" + $(if (Ok $job.page) { $job.page } else { 'web/short.html' })
$steps = $(if ($job.steps) { "$($job.steps)" } else { 'words,audio,render,encode' }).Split(',') | ForEach-Object { $_.Trim() }
$scale = $(if ("$($job.scale)" -match '^(1|1\.25|1\.5|1\.75|2)$') { "$($job.scale)" } else { '2' })
New-Item -ItemType Directory -Force $out | Out-Null
$status = "$out\STATUS.txt"; "make $($job.name) started $(Get-Date -f s) steps=$($steps -join ',') scale=$scale" | Out-File $status -Encoding utf8
function Step($n, [scriptblock]$b) {
  if ($steps -notcontains $n) { return }
  $t = Get-Date; Write-Host "   step $n ..." -ForegroundColor Cyan; "== step $n"
  & $b
  $ok = ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE)
  $line = "{0,-7} {1} {2:n0} s" -f $n, $(if ($ok) { 'ok' } else { "FAILED (exit $LASTEXITCODE)" }), ((Get-Date) - $t).TotalSeconds
  $line | Out-File $status -Append -Encoding utf8
  if (-not $ok) { "FAILED at $n - see logs" | Out-File $status -Append -Encoding utf8; exit 1 }
}
if (($steps -contains 'words') -or ($steps -contains 'audio')) {
  if (-not (Ok $job.voice) -or -not (Test-Path "$Root\$($job.voice)")) { 'missing voice file' | Out-File $status -Append; exit 1 }
  Copy-Item "$Root\$($job.voice)" "$aud\voice.wav" -Force
}
Step 'words' {
  & $py "$Studio\kit\local\words.py" "$aud\voice.wav" "$out\asr.json"
  if ($LASTEXITCODE -eq 0) {
    $disp = @(); if (Test-Path "$aud\display.json") { $disp = @('--display', "$aud\display.json") }
    & $py "$Studio\kit\explainer3d\tools\align.py" "$aud\sentences.json" "$aud\words.json" "$out\asr.json" @disp
    Copy-Item "$aud\words.json" "$out\words.json" -Force
  }
}
Step 'audio' {
  & $py -c "import scipy" 2>$null; if ($LASTEXITCODE -ne 0) { & $py -m pip install -q scipy }
  node "$Studio\kit\local\local_render.mjs" events $Studio $page $aud
  if ($LASTEXITCODE -eq 0) { $sec = @(); if (Test-Path "$aud\sections.json") { $sec = @('--sections', "$aud\sections.json") }
    & $py "$Studio\kit\explainer3d\tools\audio_kit.py" "$aud\events.json" "$aud\sentences.json" $aud @sec }
  if ($LASTEXITCODE -eq 0) { & $py "$Studio\kit\explainer3d\tools\mix.py" "$aud\voice.wav" "$aud\music.wav" "$aud\sfx.wav" $aud; Copy-Item "$aud\final.wav" "$out\final.wav" -Force }
}
Step 'render' {
  $env:RESUME = '1'; $env:SCALE = $scale; $env:PROGRESS = "$Root\out\progress.html"
  Write-Host "   rendering $($job.name) at ${scale}x - double-click '3-VIEW PROGRESS' to watch" -ForegroundColor Cyan
  node "$Studio\kit\local\local_render.mjs" frames $Studio $page "$out\frames" auto
}
Step 'encode' {
  $wav = $(if (Test-Path "$out\final.wav") { "$out\final.wav" } else { "$aud\final.wav" })
  $a = @(); if (Test-Path $wav) { $a = @('-i', $wav, '-c:a', 'aac', '-b:a', '192k', '-shortest') }
  ffmpeg -v error -y -framerate 30 -i "$out\frames\f%04d.jpg" @a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "$out\$($job.name).mp4"
  if ($LASTEXITCODE -eq 0) { ffmpeg -v error -y -i "$out\$($job.name).mp4" -vf scale=540:960 -c:v libx264 -preset veryfast -crf 30 -c:a aac -b:a 96k -movflags +faststart "$out\preview.mp4" }
  if ($LASTEXITCODE -eq 0) { ffmpeg -v error -y -i "$out\$($job.name).mp4" -vf "select='not(mod(n\,125))',scale=270:480,tile=8x2:padding=4" -frames:v 1 "$out\sheet.jpg" }
}
"DONE $(Get-Date -f s)" | Out-File $status -Append -Encoding utf8
