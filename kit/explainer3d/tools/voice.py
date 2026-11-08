# Narration with Kokoro (Apache-2.0, free, no watermark), one sentence at a time so sentence times are exact.
#   python voice.py lines.txt out_dir [voice] [speed]
# lines.txt: one sentence per line. Blank line = paragraph pause (0.5 s). A line "[pause 0.6]" adds silence.
# Writes out_dir/voice.wav (24 kHz mono) and out_dir/sentences.json [{i, text, t0, t1, f0, f1}] (frames at 30 fps).
import json, os, re, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR = os.environ.get('KOKORO_DIR', '/home/claude/kokoro')
lines, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else 'af_heart'   # channel voice (styles/STYLE.md)
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
k = Kokoro(f'{MODEL_DIR}/kokoro-v1.0.onnx', f'{MODEL_DIR}/voices-v1.0.bin')
os.makedirs(out, exist_ok=True)
sr, parts, sents, t = 24000, [], [], 0.25
parts.append(np.zeros(int(sr * 0.25), 'float32'))              # small lead-in
for raw in open(lines, encoding='utf-8').read().split('\n'):
    line = raw.strip()
    m = re.match(r'\[pause ([\d.]+)\]', line)
    if not line or m:
        gap = float(m.group(1)) if m else 0.25                 # 0.25 + 0.25 after a sentence = 0.5 at paragraph ends
        parts.append(np.zeros(int(sr * gap), 'float32')); t += gap; continue
    a, r = k.create(line, voice=voice, speed=speed, lang='en-us')
    a = a.astype('float32')
    nz = np.where(np.abs(a) > 0.01)[0]                          # trim Kokoro's own silence for exact timing
    a = a[max(0, nz[0] - 240): nz[-1] + 480] if len(nz) else a
    sents.append({'i': len(sents), 'text': line, 't0': round(t, 3), 't1': round(t + len(a) / sr, 3)})
    parts.append(a); t += len(a) / sr
    parts.append(np.zeros(int(sr * 0.25), 'float32')); t += 0.25
parts.append(np.zeros(int(sr * 0.6), 'float32'))
audio = np.concatenate(parts)
for s in sents: s['f0'], s['f1'] = round(s['t0'] * 30), round(s['t1'] * 30)
sf.write(f'{out}/voice.wav', audio, sr)
json.dump(sents, open(f'{out}/sentences.json', 'w'), indent=1)
print(f'{len(sents)} sentences, {len(audio) / sr:.2f} s, voice {voice} x{speed}')
