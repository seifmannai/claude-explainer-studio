# How It Really Works - install the extra free tools (run by the runner's "tools" job; safe to run again).
#   Blender (GPL, free)            -> photo-real hero shots on the NVIDIA GPU (Cycles / EEVEE)
#   faster-whisper (MIT) + CUDA libs -> exact word timings on the GPU, in a private Python env: <Root>\py
param([Parameter(Mandatory = $true)][string]$Root)
$ErrorActionPreference = 'Continue'

'== Blender =='
$have = Get-ChildItem "$env:ProgramFiles\Blender Foundation" -Recurse -Filter blender.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $have) { winget install --id BlenderFoundation.Blender -e --silent --accept-package-agreements --accept-source-agreements }
$bl = Get-ChildItem "$env:ProgramFiles\Blender Foundation" -Recurse -Filter blender.exe -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
if ($bl) {
  "blender.exe: $($bl.FullName)"
  # Lists the GPUs Cycles can use (proves the GTX 1060 is supported by this Blender version).
  & $bl.FullName -b --factory-startup --python-expr "import bpy; p = bpy.context.preferences.addons['cycles'].preferences; p.refresh_devices(); print('BLENDER', bpy.app.version_string); [print('CYCLES', t, [(d.name, d.type) for d in p.get_devices_for_type(t)]) for t in ('CUDA', 'OPTIX')]"
} else { 'Blender not found after install' }

'== faster-whisper =='
$py = "$Root\py\Scripts\python.exe"
if (-not (Test-Path $py)) {
  if (Get-Command py -ErrorAction SilentlyContinue) { py -3.12 -m venv "$Root\py" } else { python -m venv "$Root\py" }
}
& $py -c "import faster_whisper" 2>$null
if ($LASTEXITCODE -ne 0) {
  & $py -m pip install --upgrade pip
  & $py -m pip install faster-whisper numpy nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"
  'downloading the whisper model (about 3 GB, first time only) and testing the GPU ...'
  & $py "$Root\studio\kit\local\words.py" --selftest
} else { 'faster-whisper already installed' }

'== Kokoro voice (Apache-2.0) =='
& $py -c "import kokoro_onnx" 2>$null; if ($LASTEXITCODE -ne 0) { & $py -m pip install kokoro-onnx soundfile }
$kd = "$Root\models\kokoro"; New-Item -ItemType Directory -Force $kd | Out-Null
foreach ($f in 'kokoro-v1.0.onnx', 'voices-v1.0.bin') { if (-not (Test-Path "$kd\$f")) { Invoke-WebRequest -Uri "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/$f" -OutFile "$kd\$f" } }
& $py -c "from kokoro_onnx import Kokoro; k = Kokoro(r'$kd\kokoro-v1.0.onnx', r'$kd\voices-v1.0.bin'); a, sr = k.create('Kokoro works.', voice='am_puck'); print('KOKORO OK', len(a) / sr, 's')"

'== Chatterbox voice (MIT, expressive) in its own env: <Root>\pycb =='
$cb = "$Root\pycb\Scripts\python.exe"
if (-not (Test-Path $cb)) {
  foreach ($v in '-3.11', '-3.12') { if (-not (Test-Path $cb)) { py $v -m venv "$Root\pycb" 2>$null } }
  if (-not (Test-Path $cb)) { python -m venv "$Root\pycb" }
}
if (-not (Test-Path $cb)) { 'Chatterbox: no Python found for its env' } else {
& $cb --version
& $cb -m pip install --upgrade pip
# torch 2.6 CUDA 12.4 build still supports Pascal GPUs (GTX 1060)
& $cb -m pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu124
& $cb -m pip install chatterbox-tts
& $cb "$Root\studio\kit\local\voice_cb.py" --selftest "$Root\out\voice_test"
}

'== HyperFrames (Apache-2.0, HTML -> video for 2D/cartoon scenes) =='
node -v
New-Item -ItemType Directory -Force "$Root\hyperframes" | Out-Null
if (-not (Test-Path "$Root\hyperframes\package.json")) { '{"name":"hirw-hyperframes","private":true}' | Out-File "$Root\hyperframes\package.json" -Encoding ascii }
npm install --prefix "$Root\hyperframes" hyperframes
npx --prefix "$Root\hyperframes" hyperframes --version

'== tools done ==' 
