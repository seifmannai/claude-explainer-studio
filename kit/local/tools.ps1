# How It Really Works - install the extra free tools (run by the runner's "tools" job; safe to run again).
#   Blender (GPL, free)            -> photo-real hero shots on the NVIDIA GPU (Cycles / EEVEE)
#   faster-whisper (MIT) + CUDA libs -> exact word timings on the GPU, in a private Python env: <Root>\py
param([Parameter(Mandatory = $true)][string]$Root)
$ErrorActionPreference = 'Continue'

'== Blender =='
winget install --id BlenderFoundation.Blender -e --silent --accept-package-agreements --accept-source-agreements
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
& $py -m pip install --upgrade pip
& $py -m pip install faster-whisper numpy nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"
'downloading the whisper model (about 3 GB, first time only) and testing the GPU ...'
& $py "$Root\studio\kit\local\words.py" --selftest
'== tools done =='
