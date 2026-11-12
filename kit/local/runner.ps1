# How It Really Works - job runner. Leave this window open while Claude works.
# Claude drops job files in jobs\ ; only the actions listed below can run (make = a whole video, selfupdate = new runner from GitHub). Logs go to logs\.
$Root = $PSScriptRoot; $Studio = "$Root\studio"
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
# portable Node from the install step (<Root>\node) wins over anything else
$nx = Get-ChildItem "$Root\node" -Recurse -Filter node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nx) { $env:Path = "$($nx.DirectoryName);$env:Path" }
$Safe = '^[A-Za-z0-9_\-./]+$'
function Ok($v) { return ($v -is [string]) -and ($v -match $Safe) -and ($v -notmatch '\.\.') }
Write-Host "How It Really Works runner is ON. Keep this window open (Ctrl+C to stop)." -ForegroundColor Green
while ($true) {
  Get-ChildItem "$Root\jobs\*.json" -ErrorAction SilentlyContinue | ForEach-Object {
    $file = $_; $id = $file.BaseName; $log = "$Root\logs\$id.log"
    try { $job = Get-Content $file.FullName -Raw | ConvertFrom-Json } catch { "bad json" | Out-File $log; Move-Item $file.FullName "$Root\jobs\done\" -Force; return }
    Write-Host "$(Get-Date -f HH:mm:ss) job $id : $($job.action)" -ForegroundColor Yellow
    "STARTED $(Get-Date -f s) $($job.action)" | Out-File $log
    switch ($job.action) {
      'pull' { git -C $Studio pull *>> $log }
      'npm' { if (Ok $job.dir) { npm install --prefix "$Studio\$($job.dir)" *>> $log } else { 'rejected: dir' | Out-File $log -Append } }
      'three' { if (Ok $job.dir) { npm install --prefix "$Studio\$($job.dir)" three@0.170.0 --no-save *>> $log } else { 'rejected: dir' | Out-File $log -Append } }
      'speedtest' { if (Ok $job.page) { node "$Studio\kit\local\local_render.mjs" speedtest $Studio $job.page "$Root\out\speedtest" 30 *>> $log } }
      'render' {
        if ((Ok $job.page) -and (Ok $job.name) -and ($job.range -match '^\d+-\d+$')) {
          $env:RESUME = '1'; $env:SCALE = $(if ("$($job.scale)" -match '^(1|1\.25|1\.5|1\.75|2)$') { "$($job.scale)" } else { '1' }); Write-Host "   rendering $($job.name) at $($env:SCALE)x - double-click '3-VIEW PROGRESS' to watch" -ForegroundColor Cyan; node "$Studio\kit\local\local_render.mjs" frames $Studio $job.page "$Root\out\$($job.name)" $job.range *>> $log
        } else { 'rejected: page/name/range' | Out-File $log -Append } }
      'encode' {
        if ((Ok $job.name) -and (Ok $job.audio)) {
          ffmpeg -y -framerate 30 -i "$Root\out\$($job.name)\f%04d.jpg" -i "$Root\$($job.audio)" -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$Root\out\$($job.name).mp4" *>> $log
        } elseif (Ok $job.name) {
          ffmpeg -y -framerate 30 -i "$Root\out\$($job.name)\f%04d.jpg" -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -movflags +faststart "$Root\out\$($job.name).mp4" *>> $log
        } else { 'rejected: name' | Out-File $log -Append } }
      'hdri' {
        if ($job.slug -match '^[a-z0-9_]+$') {
          New-Item -ItemType Directory -Force "$Studio\assets\hdri" | Out-Null
          Invoke-WebRequest -Uri "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/$($job.slug)_2k.hdr" -OutFile "$Studio\assets\hdri\studio.hdr" *>> $log
          "saved $($job.slug) (Poly Haven, CC0)" | Out-File $log -Append
        } else { 'rejected: slug' | Out-File $log -Append } }
      'still' {
        # optional "query": page options, e.g. "t=16.5&ink=1&drawn=1" (letters, digits, = & . , - only)
        # the query goes through an env var: a '&' on the command line breaks node when it is a .cmd shim (2026-11-12 bug)
        $env:PAGE_QUERY = $(if ($job.query -and ("$($job.query)" -match '^[A-Za-z0-9_=&.,\-]+$')) { "$($job.query)" } else { '' })
        if ((Ok $job.page) -and (Ok $job.name)) {
          # find the real node.exe (a .cmd/.ps1 shim or a missing PATH entry made stills exit silently on 2026-11-12)
          $node = @((Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source), "$env:ProgramFiles\nodejs\node.exe") | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
          "node: $node | query: $env:PAGE_QUERY" | Out-File $log -Append
          try { & $node "$Studio\kit\local\local_render.mjs" still $Studio $job.page "$Root\out\stills" $job.name *>> $log; "node exit code: $LASTEXITCODE" | Out-File $log -Append }
          catch { "ERROR: $_" | Out-File $log -Append }
        } else { 'rejected: page/name' | Out-File $log -Append }
        $env:PAGE_QUERY = '' }
      'tools' { Write-Host "   installing Blender, faster-whisper, Kokoro, Chatterbox, HyperFrames (big downloads, 20-40 min)" -ForegroundColor Cyan; & "$Studio\kit\local\tools.ps1" -Root $Root *>> $log }
      'words' {
        if ((Ok $job.audio) -and (Ok $job.name)) {
          $txt = $(if (Ok $job.script) { "$Studio\$($job.script)" } else { $null })
          New-Item -ItemType Directory -Force "$Root\out\words" | Out-Null
          if ($txt) { & "$Root\py\Scripts\python.exe" "$Studio\kit\local\words.py" "$Root\$($job.audio)" "$Root\out\words\$($job.name).json" $txt *>> $log }
          else { & "$Root\py\Scripts\python.exe" "$Studio\kit\local\words.py" "$Root\$($job.audio)" "$Root\out\words\$($job.name).json" *>> $log }
        } else { 'rejected: audio/name' | Out-File $log -Append } }
      'blender' {
        if ((Ok $job.script) -and (Ok $job.name)) {
          $bl = Get-ChildItem "$env:ProgramFiles\Blender Foundation" -Recurse -Filter blender.exe -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
          Write-Host "   Blender rendering $($job.name) (in the background)" -ForegroundColor Cyan
          & $bl.FullName -b --factory-startup -P "$Studio\$($job.script)" -- "$Root\out\$($job.name)" *>> $log
        } else { 'rejected: script/name' | Out-File $log -Append } }
      'make' {
        # whole video in one job; the steps live in the repo (kit\local\make.ps1), so new steps need no runner update
        git -C $Studio fetch -q origin *>> $log; git -C $Studio reset -q --hard origin/main *>> $log
        & "$Studio\kit\local\make.ps1" -Root $Root -JobFile $file.FullName *>> $log }
      'selfupdate' {
        # take the newest runner from the repo and restart this window with it
        git -C $Studio fetch -q origin *>> $log; git -C $Studio reset -q --hard origin/main *>> $log
        Copy-Item "$Studio\kit\local\runner.ps1" "$Root\runner.ps1" -Force
        "FINISHED $(Get-Date -f s) (restarting)" | Out-File $log -Append; Move-Item $file.FullName "$Root\jobs\done\" -Force
        Start-Process "$Root\2-START RUNNER (keep open).bat"; exit }
      default { "rejected: unknown action" | Out-File $log -Append }
    }
    "FINISHED $(Get-Date -f s)" | Out-File $log -Append
    Move-Item $file.FullName "$Root\jobs\done\" -Force
    Write-Host "$(Get-Date -f HH:mm:ss) job $id done" -ForegroundColor Green
  }
  Start-Sleep -Seconds 3
}
