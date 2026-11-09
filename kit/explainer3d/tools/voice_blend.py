# Natural narration: Kokoro voice blend + per-line speed and pause.
#   python voice_blend.py script.txt out_dir [voiceA=am_michael] [weightA=0.4] [voiceB=am_puck]
# script.txt lines: "text|speed|pause"; '#' comments; blank lines ignored.
# Writes out_dir/voice_raw.wav, voice.wav (EQ + gentle comp + tiny room, -16 LUFS) and sentences.json.
import json, os, sys, subprocess
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
MODEL_DIR = os.environ.get('KOKORO_DIR', '/home/claude/kokoro')
src, out = sys.argv[1], sys.argv[2]
va = sys.argv[3] if len(sys.argv) > 3 else 'am_michael'
wa = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4
vb = sys.argv[5] if len(sys.argv) > 5 else 'am_puck'
k = Kokoro(f'{MODEL_DIR}/kokoro-v1.0.onnx', f'{MODEL_DIR}/voices-v1.0.bin')
style = k.get_voice_style(va) * wa + k.get_voice_style(vb) * (1 - wa)
os.makedirs(out, exist_ok=True)
sr, t, parts, sents = 24000, 0.3, [np.zeros(int(24000 * 0.3), 'float32')], []
for raw in open(src, encoding='utf-8'):
    raw = raw.strip()
    if not raw or raw.startswith('#'): continue
    text, speed, pause = (raw.split('|') + ['1.0', '0.4'])[:3]
    a, _ = k.create(text, voice=style, speed=float(speed), lang='en-us'); a = a.astype('float32')
    nz = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, nz[0] - 240): nz[-1] + 600]
    sents.append({'i': len(sents), 'text': text, 't0': round(t, 3), 't1': round(t + len(a) / sr, 3)})
    parts += [a, np.zeros(int(sr * float(pause)), 'float32')]; t += len(a) / sr + float(pause)
audio = np.concatenate(parts); audio = audio / np.abs(audio).max() * 0.8
for s in sents: s['f0'], s['f1'] = round(s['t0'] * 30), round(s['t1'] * 30)
sf.write(f'{out}/voice_raw.wav', audio, sr)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{out}/voice_raw.wav', '-af',
  'highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=1.5,'
  'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,aecho=0.85:0.5:18|33:0.12|0.07,'
  'loudnorm=I=-16:TP=-1.5', '-ar', '48000', f'{out}/voice.wav'], check=True)
json.dump(sents, open(f'{out}/sentences.json', 'w'), indent=1)
print(f'{len(sents)} lines, {len(audio) / sr:.2f} s')
