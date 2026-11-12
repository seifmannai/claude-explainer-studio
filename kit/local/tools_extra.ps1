# How It Really Works - extra free tools, installed by the make job's 'install' step (safe to run again).
#   Open Image Denoise (Intel, Apache-2.0) -> <Root>\oidn\bin\oidnDenoise.exe : clean frames from 2-4 samples
#   WhisperX (BSD-2) in its own env <Root>\pywx -> forced alignment of the script to the voice (exact word times)
param([Parameter(Mandatory = $true)][string]$Root)
$ErrorActionPreference = 'Continue'; $ProgressPreference = 'SilentlyContinue'

'== Open Image Denoise =='
$od = "$Root\oidn"
$exe = Get-ChildItem $od -Recurse -Filter oidnDenoise.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $exe) {
  New-Item -ItemType Directory -Force $od | Out-Null
  try {
    $rel = Invoke-RestMethod 'https://api.github.com/repos/RenderKit/oidn/releases/latest' -Headers @{ 'User-Agent' = 'hirw' }
    $as = $rel.assets | Where-Object { $_.name -match 'x64\.windows\.zip$' } | Select-Object -First 1
    "downloading $($as.name) ($([int]($as.size / 1MB)) MB)"
    Invoke-WebRequest $as.browser_download_url -OutFile "$od\oidn.zip"
    Expand-Archive "$od\oidn.zip" $od -Force; Remove-Item "$od\oidn.zip"
  } catch { "OIDN download failed: $_" }
  $exe = Get-ChildItem $od -Recurse -Filter oidnDenoise.exe -ErrorAction SilentlyContinue | Select-Object -First 1
}
if ($exe) {
  "oidnDenoise: $($exe.FullName)"; $exe.FullName | Out-File "$od\path.txt" -Encoding ascii
  & $exe.FullName --help 2>&1 | Select-Object -First 3
  & $exe.FullName --list-devices 2>&1 | Select-Object -First 12
  'OIDN OK'
} else { 'OIDN NOT INSTALLED' }

'== WhisperX =='
$wx = "$Root\pywx\Scripts\python.exe"
if (-not (Test-Path $wx)) {
  foreach ($v in '-3.11', '-3.12') { if (-not (Test-Path $wx)) { py $v -m venv "$Root\pywx" 2>$null } }
  if (-not (Test-Path $wx)) { python -m venv "$Root\pywx" }
}
if (-not (Test-Path $wx)) { 'WhisperX: no Python found for its env' } else {
  & $wx --version
  & $wx -c "import whisperx" 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $wx -m pip install -q --upgrade pip
    # torch 2.6 CUDA 12.4 build still supports Pascal GPUs (GTX 1060); keep whisperx from replacing it
    & $wx -m pip install -q torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
    "torch==2.6.0`ntorchaudio==2.6.0" | Out-File "$Root\pywx\pin.txt" -Encoding ascii
    foreach ($spec in 'whisperx', 'whisperx==3.3.4', 'whisperx==3.3.1') {
      & $wx -c "import whisperx" 2>$null; if ($LASTEXITCODE -eq 0) { break }
      "trying $spec"; & $wx -m pip install -q $spec -c "$Root\pywx\pin.txt" 2>&1 | Select-Object -Last 4
    }
  }
  & $wx -m pip list 2>$null | Select-String '^(whisperx|torch|torchaudio|ctranslate2|faster-whisper) '
  & $wx "$Root\studio\kit\local\words_wx.py" --selftest
}
'== extra tools done =='
$global:LASTEXITCODE = 0
