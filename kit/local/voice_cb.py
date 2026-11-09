# Expressive narration with Chatterbox TTS (Resemble AI, MIT) on the PC GPU. Same contract as voice_blend.py.
#   python voice_cb.py script.txt out_dir [--ref ref.wav] [--exag 0.6]
#   python voice_cb.py --selftest out_dir
# script.txt lines: "text|speed|pause" ('#' comments). Speed is ignored by Chatterbox (it paces itself); pause is kept.
# Writes out_dir/voice_raw.wav, voice.wav (same polish chain as Kokoro) and sentences.json.
import json, os, sys, subprocess
import numpy as np, soundfile as sf

args = sys.argv[1:]
selftest = args and args[0] == '--selftest'
ref = args[args.index('--ref') + 1] if '--ref' in args else None
exag = float(args[args.index('--exag') + 1]) if '--exag' in args else 0.6
import torch
from chatterbox.tts import ChatterboxTTS
dev = 'cuda' if torch.cuda.is_available() else 'cpu'
print('device:', dev, torch.cuda.get_device_name(0) if dev == 'cuda' else '')
model = ChatterboxTTS.from_pretrained(device=dev)
sr = model.sr

def say(text):
    kw = {'exaggeration': exag, 'cfg_weight': 0.45}
    if ref: kw['audio_prompt_path'] = ref
    return model.generate(text, **kw).squeeze(0).cpu().numpy().astype('float32')

if selftest:
    out = args[1]; os.makedirs(out, exist_ok=True)
    a = say('Two a.m. Frozen pizza. No oven. So... you have to invent one!')
    sf.write(os.path.join(out, 'chatterbox_test.wav'), a, sr); print('CHATTERBOX OK', round(len(a) / sr, 2), 's'); sys.exit(0)

src, out = args[0], args[1]; os.makedirs(out, exist_ok=True)
t, parts, sents = 0.3, [np.zeros(int(sr * 0.3), 'float32')], []
for raw in open(src, encoding='utf-8'):
    raw = raw.strip()
    if not raw or raw.startswith('#'): continue
    text, _speed, pause = (raw.split('|') + ['1.0', '0.4'])[:3]
    a = say(text); nz = np.where(np.abs(a) > 0.01)[0]
    if len(nz): a = a[max(0, nz[0] - int(sr * 0.01)): nz[-1] + int(sr * 0.025)]
    sents.append({'i': len(sents), 'text': text, 't0': round(t, 3), 't1': round(t + len(a) / sr, 3)})
    parts += [a, np.zeros(int(sr * float(pause)), 'float32')]; t += len(a) / sr + float(pause)
    print(len(sents), text)
audio = np.concatenate(parts); audio = audio / np.abs(audio).max() * 0.8
for s in sents: s['f0'], s['f1'] = round(s['t0'] * 30), round(s['t1'] * 30)
sf.write(os.path.join(out, 'voice_raw.wav'), audio, sr)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', os.path.join(out, 'voice_raw.wav'), '-af',
  'highpass=f=70,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3500:t=q:w=1.2:g=1.5,'
  'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,aecho=0.85:0.5:18|33:0.12|0.07,'
  'loudnorm=I=-16:TP=-1.5', '-ar', '48000', os.path.join(out, 'voice.wav')], check=True)
json.dump(sents, open(os.path.join(out, 'sentences.json'), 'w'), indent=1)
print(f'{len(sents)} lines, {len(audio) / sr:.2f} s')
