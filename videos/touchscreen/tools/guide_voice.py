# Guide voice for the live preview: Kokoro blend (am_michael 0.4 + am_puck 0.6), one line at a time, word times
# estimated inside each spoken line (trimmed to the real speech onset/offset; words shared by syllable weight).
# The real channel voice replaces it later (make job wxwords -> words.json); every event is hung on words, so nothing moves by hand.
import sys, json, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
model, voices, script, out_wav, out_json = sys.argv[1:6]
k = Kokoro(model, voices)
st = 0.4 * k.get_voice_style('am_michael') + 0.6 * k.get_voice_style('am_puck')
SR = 24000
lines = []
for raw in open(script, encoding='utf-8'):
    raw = raw.rstrip('\n')
    if raw.startswith('#'): continue
    if not raw.strip(): lines.append(None); continue
    t, sp, pa = raw.split('|'); lines.append((t, float(sp), float(pa)))
audio = [np.zeros(int(SR * 0.35), np.float32)]; cur = 0.35; words = []; sent = []; si = 0
def syl(w):
    w = re.sub(r'[^a-z]', '', w.lower()); return max(1, len(re.findall(r'[aeiouy]+', w))) + 0.15 * len(w)
for L in lines:
    if L is None: continue
    text, sp, pause = L
    y, sr = k.create(text, voice=st, speed=sp * 1.04, lang='en-us'); y = y.astype(np.float32)
    env = np.abs(y) > 0.02; idx = np.where(env)[0]
    a, b = (idx[0], idx[-1]) if len(idx) else (0, len(y) - 1)
    a = max(0, a - int(0.02 * SR)); b = min(len(y), b + int(0.06 * SR)); y = y[a:b]
    dur = len(y) / SR; ws = text.split(); wt = [syl(w) for w in ws]
    # punctuation inside a line is a small pause
    gaps = [0.22 if re.search(r'[.,:!?]$', w) and i < len(ws) - 1 else 0 for i, w in enumerate(ws)]
    speak = dur - sum(gaps); tot = sum(wt); t = cur
    for i, w in enumerate(ws):
        d = speak * wt[i] / tot
        words.append({'w': re.sub(r'[^\w\'-]', '', w), 't': round(t, 3), 'end': round(t + d, 3), 's': si})
        t += d + gaps[i]
    sent.append({'s': si, 'text': text, 't': round(cur, 3), 'end': round(cur + dur, 3)})
    audio.append(y); audio.append(np.zeros(int(SR * pause), np.float32)); cur += dur + pause; si += 1
audio.append(np.zeros(int(SR * 0.6), np.float32))
y = np.concatenate(audio); y = y / max(1e-6, np.abs(y).max()) * 0.89
sf.write(out_wav, y, SR)
json.dump({'words': words, 'sentences': sent, 'dur': round(len(y) / SR, 3), 'source': 'guide kokoro blend40, estimated word times'}, open(out_json, 'w'), indent=0)
print('dur', len(y) / SR, 'sentences', si, 'words', len(words))
