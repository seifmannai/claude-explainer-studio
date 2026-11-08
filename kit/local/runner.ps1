# How It Really Works - job runner. Leave this window open while Claude works.
# Claude drops job files in jobs\ ; only the actions listed below can run. Logs go to logs\.
$Root = $PSScriptRoot; $Studio = "$Root\studio"
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
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
      'still' { if ((Ok $job.page) -and (Ok $job.name)) { node "$Studio\kit\local\local_render.mjs" still $Studio $job.page "$Root\out\stills" $job.name *>> $log } else { 'rejected: page/name' | Out-File $log -Append } }
      default { "rejected: unknown action" | Out-File $log -Append }
    }
    "FINISHED $(Get-Date -f s)" | Out-File $log -Append
    Move-Item $file.FullName "$Root\jobs\done\" -Force
    Write-Host "$(Get-Date -f HH:mm:ss) job $id done" -ForegroundColor Green
  }
  Start-Sleep -Seconds 3
}
