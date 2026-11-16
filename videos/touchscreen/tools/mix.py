# mix.py - sound for the live preview: voice + synthesized SFX on the film's cues + a soft original pad.
# Cues come from film/cues.js through node (same times as the picture). Music ~19 dB under the voice, off on gags.
#   node -e "...makeCues..." > cues.json ; python tools/mix.py voice.wav cues.json film/audio/mix.wav
import sys, json, numpy as np, soundfile as sf
voice_path, cues_path, out = sys.argv[1:4]
SR = 44100
v, vsr = sf.read(voice_path, dtype='float32')
if v.ndim > 1: v = v.mean(1)
v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v).astype(np.float32)
C = json.load(open(cues_path)); N = int(C['DUR'] * SR) + SR
rng = np.random.default_rng(7)
def T(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=None):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if r: nr = min(n, int(r * SR)); e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e
def lp(x, k):  # one-pole low-pass, k 0..1 (higher = brighter)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += k * (x[i] - s); y[i] = s
    return y
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def boop(): t = T(0.18); f = 520 * np.exp(-t * 9); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, 0.12) * 0.5
def tap(): t = T(0.06); return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.4 + noise(0.06) * np.exp(-t * 120) * 0.15
def whoosh(d=0.7, up=True):
    n = noise(d); t = T(d); k = 0.02 + 0.25 * (t / d if up else 1 - t / d); y = np.empty_like(n); s = 0.0
    for i in range(len(n)): s += k[i] * (n[i] - s); y[i] = s
    return y * np.sin(np.pi * t / d) * 1.6
def rewind(d=2.2):
    t = T(d); f = 300 + 900 * np.abs(np.sin(t * 9)) * (1 - t / d); w = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18
    return (w + whoosh(d) * 0.6) * env(len(t), 0.05, 0.3)
def tick(): t = T(0.03); return np.sin(2 * np.pi * 3000 * t) * np.exp(-t * 200) * 0.3
def crack():
    n = noise(0.9); t = T(0.9); return (n * np.exp(-t * 7) * 0.9 + lp(noise(0.9), 0.05) * np.exp(-t * 4) * 1.5 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 10) * 0.8) * 0.8
def glass():
    out = np.zeros(int(1.2 * SR))
    for i in range(14):
        s = int(rng.uniform(0, 0.8) * SR); t = T(0.25); f = rng.uniform(2500, 6000)
        b = np.sin(2 * np.pi * f * t) * np.exp(-t * 25) * 0.12; out[s:s + len(b)] += b[:len(out) - s]
    return out
def spark(d=0.4): n = noise(d); g = (rng.uniform(0, 1, len(n)) > 0.985).astype(float); return lp(n * g * 3, 0.6) * env(len(n), 0.002, 0.1) * 0.6
def ding(f=1320): t = T(1.2); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3.5) * 0.35
def alarm(d=1.2): t = T(d); f = np.where((t * 4) % 1 < 0.5, 880, 660); return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12 * env(len(t), 0.01, 0.2)
def flybuzz(d=1.2): t = T(d); f = 190 + 25 * np.sin(t * 13); return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 0.15) * (0.3 + 0.2 * np.sin(t * 7)) * env(len(t), 0.1, 0.3) * 0.5
def thud(): t = T(0.4); return (np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 6)) / SR) * np.exp(-t * 9) + noise(0.4) * np.exp(-t * 40) * 0.3) * 0.9
def pop(): t = T(0.08); return np.sin(2 * np.pi * np.cumsum(900 - 6000 * t) / SR) * np.exp(-t * 50) * 0.35
def squeak(): t = T(0.35); f = 1400 + 900 * np.sin(t * 18); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.02, 0.1) * 0.18
def bzzt(d=0.45): t = T(d); return np.sign(np.sin(2 * np.pi * 150 * t)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t))) * 0.25 * env(len(t), 0.005, 0.05)
def snap(): t = T(0.3); return (noise(0.3) * np.exp(-t * 30) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 40)) * 0.8
def splat(): t = T(0.3); return lp(noise(0.3), 0.08) * np.exp(-t * 12) * 2.0
def zap(d=0.6): t = T(d); return np.sin(2 * np.pi * (2000 + 1500 * np.sin(t * 60)) * t) * 0.1 * env(len(t), 0.01, 0.2) + spark(d) * 0.5
def drip(): t = T(0.15); return np.sin(2 * np.pi * np.cumsum(600 + 1800 * t / 0.15) / SR) * np.exp(-t * 30) * 0.25
def chime_up(): return sum(np.pad(ding(f) * 0.5, (int(i * 0.07 * SR), int(1.6 * SR)))[:int(1.5 * SR)] for i, f in enumerate([880, 1100, 1320, 1760]))
fx = np.zeros(N)
def put(at, s, gain=1.0):
    i = int(at * SR)
    if i < 0 or i >= N: return
    s = s[:N - i]; fx[i:i + len(s)] += s * gain
c = C
for k in ['poke0', 'poke0b']: put(c[k], boop())
for k in ['fingerTap', 'fingerTap2']: put(c[k], tap())
put(c['fingerTap2'] + 0.45, tap()); put(c['dreamPoke'], boop(), 1.2); put(c['dream'] - 0.1, pop())
put(c['rw0'], rewind(c['rw1'] - c['rw0']), 1.0)
put(max(c['poke65'], c['rw1'] + 0.05), tap()); put(c['poke65b'], tap())
for i in range(4): put(c['engIn'] + 0.25 + i * 0.38, tick() * 1.5)   # footsteps
put(c['engPoint'], pop()); put(c['field'], zap(1.4)); put(c['salt'], pop()); put(c['touch65'] + 0.3, tap())
put(c['steal'], chime_up() * 0.6); put(c['notice'], alarm(0.8) * 0.7); put(c['theft'], thud()); put(c['yourTouch'], ding(1760))
put(c['scary'] - 0.3, alarm(1.0)); put(c['runOff'], whoosh(0.5)); put(c['scary'], spark(0.8))
put(c['ff1a'], rewind(c['ff1b'] - c['ff1a']))
put(c['sheets'] - 0.3, whoosh(0.5)); put(c['gap'], pop()); put(c['contact'], spark(0.3)); put(c['closes'], ding(1500))
put(c['wind'], whoosh(0.4, True) * 0.6); put(c['hit'], crack(), 1.0); put(c['hit'] + 0.05, glass())
for i in range(3): put(c['hit'] + 0.5 + i * 0.25, ding(2200) * 0.2)          # dizzy stars
for k in ['wp1a', 'wp2a', 'wp4a', 'wp5a']: put(c[k], whoosh(0.65))
put(c['wp3a'], whoosh(c['wp3b'] - c['wp3a']))
for i in range(8): put(c['beams'] + i * 0.09, tick())
for i in range(7): put(c['beams2'] + i * 0.09, tick())
put(c['block'] + 0.3, tap()); put(c['knows'], ding(1320))
put(c['flyIn'], flybuzz(c['flyLand'] - c['flyIn'])); put(c['del'], thud() * 0.7); put(c['del'] + 0.1, whoosh(0.8) * 0.6)
put(c['fired'], thud()); put(c['fired'] + 0.1, flybuzz(1.0) * 0.6)
for i in range(3): put(c['tap96'] + i * 0.45, tap())
put(c['pen'], pop())
for i in range(int((c['four'] + 0.4 - c['lost']) / 0.12)): put(c['lost'] + i * 0.12, tick() * 0.8)   # the timer racing
put(c['four'] + 0.4, ding(990)); put(c['catPen'], boop())
put(c['steal07'], chime_up() * 0.5); put(c['wires'], zap(0.9) * 0.6); put(c['ten'], chime_up() * 0.5)
for i in range(10): put(c['ten'] + i * 0.06, pop() * 0.5)
put(c['pinch'], whoosh(0.6) * 0.6); put(c['winter'], whoosh(1.5, False) * 0.7)
for i in range(3): put(c['glove'] + i * 0.55, splat() * 0.6)
put(c['nothing'], boop())
put(c['smear'], splat()); put(c['grease1'], squeak() * 0.7); put(c['coat'], whoosh(0.8) * 0.6)
for i in range(6): put(c['slide'] + i * 0.11, drip())
put(c['slide'] + 0.4, squeak())
put(c['merge'], whoosh(0.6) * 0.6); put(c['merge'] + 0.6, ding(1760) * 0.6); put(c['ownLight'], chime_up() * 0.6)
put(c['fold'], whoosh(0.5) * 0.4); put(c['wrongWay'], squeak()); put(c['snap'], snap()); put(c['snap'] + 0.03, glass())
put(c['buzz'], bzzt(c['scream'] - c['buzz'])); put(c['pokeBack'], boop(), 1.3); put(c['scream'], whoosh(0.8))
# music: soft pad, chords that follow the eras, ~19 dB under the voice, out on the gags
eras = [0, c['rw0'], c['ff1a'], c['wp1a'], c['wp2a'], c['wp3a'], c['wp4a'], c['wp5a'], c['DUR'] + 1]
chords = [[57, 64, 69, 72], [50, 57, 62, 65], [52, 59, 64, 67], [55, 62, 67, 71], [53, 60, 65, 69], [57, 64, 69, 72], [55, 62, 67, 71], [53, 60, 64, 69]]
t = np.arange(N) / SR; mus = np.zeros(N)
for e in range(8):
    a, b = int(eras[e] * SR), min(N, int(eras[e + 1] * SR) + int(0.3 * SR))
    tt = t[a:b]; seg = np.zeros(b - a)
    for j, m in enumerate(chords[e]):
        f = 440 * 2 ** ((m - 69) / 12); seg += np.sin(2 * np.pi * f * tt + j) * (0.6 + 0.4 * np.sin(tt * 0.7 + j)) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt)
    pulse = 0.75 + 0.25 * np.sin(2 * np.pi * tt * 1.6) ** 2                      # gentle 96-ish feel
    seg *= pulse * np.minimum(1, (tt - tt[0]) / 0.25) * np.minimum(1, (tt[-1] - tt) / 0.3)
    mus[a:b] += seg
mus = lp(mus, 0.08)
gate = np.ones(N)
for k, d in [('hit', 1.4), ('snap', 1.0), ('fired', 0.9), ('del', 1.0), ('scream', 1.4), ('theft', 0.6)]:
    a, b = int((c[k] - 0.05) * SR), int((c[k] + d) * SR); gate[a:b] = 0
gate = lp(gate, 0.0008)
def rms(x): return np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2) + 1e-12)
vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]
mus *= gate * (rms(vv) / rms(mus)) * 10 ** (-19 / 20)
fx *= (rms(vv) / max(rms(fx), 1e-9)) * 10 ** (-9 / 20)
mix = vv + fx + mus
mix /= max(1.0, np.abs(mix).max() / 0.95)
sf.write(out, np.stack([mix, mix], 1).astype(np.float32), SR, subtype='PCM_16')
print('mix', out, round(N / SR, 2), 's')
# stems next to the mix: VideoHub shows them as rows with mute/solo/level ("Apply to film" rebuilds the mix)
import os
d = os.path.dirname(out); sc = 1.0 / max(1.0, np.abs(vv + fx + mus).max() / 0.95)
for name, x in [('voice', vv), ('music', mus), ('sfx', fx)]: sf.write(os.path.join(d, name + '.wav'), np.stack([x * sc, x * sc], 1).astype(np.float32), SR, subtype='PCM_16')
json.dump({'cues': [{'t': round(v_, 3), 'name': k} for k, v_ in c.items() if k not in ('DUR',) and isinstance(v_, (int, float))]}, open(os.path.join(d, 'cues.json'), 'w'))
