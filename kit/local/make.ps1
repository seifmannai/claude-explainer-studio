# One job = the whole video on the PC, so Claude does not have to drive each step (saves credits).
# Called by runner.ps1 for {"action":"make", ...} after it has reset the studio to GitHub's latest version.
# Job fields:
#   slug   videos/<slug>            (required)
#   name   output name, e.g. engine_v2   (required)
#   voice  in/<file>.wav            (required for words/audio unless the 'voice' step makes it)
#   tts    'kokoro' (default) or 'chatterbox' for the 'voice' step; it reads videos/<slug>/script.txt (text|speed|pause)
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
$steps = $(if ($job.steps) { "$($job.steps)" } else { 'voice,words,audio,render,encode' }).Split(',') | ForEach-Object { $_.Trim() }
$fps = $(if ("$($job.fps)" -match '^(24|25|30|60)$') { "$($job.fps)" } else { '30' })
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
Step 'voice' {
  New-Item -ItemType Directory -Force $aud | Out-Null
  if ("$($job.tts)" -eq 'chatterbox') { & "$Root\pycb\Scripts\python.exe" "$Studio\kit\local\voice_cb.py" "$vid\script.txt" $aud }
  else { $env:KOKORO_DIR = "$Root\models\kokoro"; & $py "$Studio\kit\explainer3d\tools\voice_blend.py" "$vid\script.txt" $aud }
  if ($LASTEXITCODE -eq 0) { New-Item -ItemType Directory -Force "$Root\in" | Out-Null; Copy-Item "$aud\voice.wav" "$Root\in\$($job.slug)_voice.wav" -Force; Copy-Item "$aud\voice.wav" "$out\voice.wav" -Force; Copy-Item "$aud\sentences.json" "$out\sentences.json" -Force }
}
if (($steps -contains 'words') -or ($steps -contains 'audio')) {
  if (($steps -contains 'voice') -and -not $job.voice) { $job | Add-Member -NotePropertyName voice -NotePropertyValue "in/$($job.slug)_voice.wav" -Force }
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
# ---- sound layer (skills/vendor/opus-sound-layer): real CC0 recordings, placed from a cue sheet ----
$sl = "$Studio\skills\vendor\opus-sound-layer\scripts"; $sx = "$Root\sfx"
Step 'sfxkit' {
  # library (once, kept in $Root\sfx\kit) + per-video searches; review files (json + sheets) go to out\<name>\sfx_review
  & $py -m pip install -q numpy scipy soundfile pyloudnorm matplotlib
  New-Item -ItemType Directory -Force $sx | Out-Null; Push-Location $sx
  if (-not (Test-Path "$sx\kit\catalog.json")) { & $py "$sl\sfx.py" kit --out "$sx\kit" }
  $rev = "$out\sfx_review"; New-Item -ItemType Directory -Force $rev | Out-Null
  if (Test-Path "$aud\sfx_search.txt") {
    foreach ($l in Get-Content "$aud\sfx_search.txt") {
      if ($l -match '^\s*#' -or $l -notmatch '\|') { continue }
      $p = $l.Split('|'); $nm = $p[0].Trim(); $ty = $p[1].Trim(); $q = $p[2].Trim(); $n = $(if ($p.Count -gt 3) { $p[3].Trim() } else { '4' })
      if (-not (Ok $nm)) { continue }
      $cd = "$sx\cand\$($job.slug)\$nm"
      if (-not (Test-Path $cd)) { & $py "$sl\sfx.py" search $q --type $ty --n $n --out $cd }
      $wavs = @(Get-ChildItem $cd -Recurse -Filter *.wav -ErrorAction SilentlyContinue | ForEach-Object FullName)
      if ($wavs.Count) { & $py "$sl\sfx.py" sheet @wavs --png "$rev\$nm.png" }
      Get-ChildItem $cd -Recurse -Filter *.json -ErrorAction SilentlyContinue | ForEach-Object { Copy-Item $_.FullName "$rev\$nm`__$($_.Name)" -Force }
    }
  }
  if (Test-Path "$aud\cc0_fetch.txt") { & $py "$Studio\kit\local\fetch_cc0.py" "$aud\cc0_fetch.txt" "$sx\long\$($job.slug)"; Copy-Item "$sx\long\$($job.slug)\index.json" "$rev\long_index.json" -Force }
  Copy-Item "$sx\kit\catalog.json" "$rev\catalog.json" -Force
  Pop-Location; $global:LASTEXITCODE = 0
}
Step 'sfxmix' {
  # cue sheet videos/<slug>/audio/cues.json (absolute paths) -> out\<name>\mix\mix.wav + mix_preview.mp3
  & $py -m pip install -q numpy scipy soundfile pyloudnorm matplotlib
  New-Item -ItemType Directory -Force "$sx\music" | Out-Null
  if (-not (Test-Path "$sx\music\$($job.slug).wav")) { & $py "$Studio\kit\local\music_gen.py" "$sx\music\$($job.slug).wav" 150 }
  Push-Location $sx; & $py "$sl\mix.py" "$aud\cues.json" --out "$out\mix"; Pop-Location
  if ($LASTEXITCODE -eq 0) { Copy-Item "$out\mix\mix.wav" "$out\final.wav" -Force; ffmpeg -v error -y -i "$out\mix\mix.wav" -b:a 192k "$out\mix_preview.mp3" }
}
Step 'render' {
  $env:RESUME = '1'; $env:SCALE = $scale; $env:PROGRESS = "$Root\out\progress.html"
  Write-Host "   rendering $($job.name) at ${scale}x - double-click '3-VIEW PROGRESS' to watch" -ForegroundColor Cyan
  node "$Studio\kit\local\local_render.mjs" frames $Studio $page "$out\frames" auto
}
Step 'encode' {
  $wav = $(if (Test-Path "$out\final.wav") { "$out\final.wav" } else { "$aud\final.wav" })
  $a = @(); if (Test-Path $wav) { $a = @('-i', $wav, '-c:a', 'aac', '-b:a', '192k', '-shortest') }
  ffmpeg -v error -y -framerate $fps -i "$out\frames\f%04d.jpg" @a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "$out\$($job.name).mp4"
  if ($LASTEXITCODE -eq 0) { ffmpeg -v error -y -i "$out\$($job.name).mp4" -vf scale=540:960 -c:v libx264 -preset veryfast -crf 30 -c:a aac -b:a 96k -movflags +faststart "$out\preview.mp4" }
  if ($LASTEXITCODE -eq 0) { ffmpeg -v error -y -i "$out\$($job.name).mp4" -vf "select='not(mod(n\,125))',scale=270:480,tile=8x2:padding=4" -frames:v 1 "$out\sheet.jpg" }
}
"DONE $(Get-Date -f s)" | Out-File $status -Append -Encoding utf8
