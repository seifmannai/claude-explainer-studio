# Stems for "The Cat Who Sank Three Ships": music.wav (march loop, stops at the twist, drone, land reprise) + sfx.wav.
# Cue times are in frames (30 fps), locked to the picture. Mixing happens in mix.py (levels are set there, not here).
import numpy as np, wave, sys
SR = 44100; FPS = 30; N_FR = 1509; DUR = 50.285688
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(7)
T = lambda f: f / FPS

def write(path, x):
    x = np.clip(x, -1, 1); y = (x * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())

def place(buf, sig, t, g=1.0):
    i = int(t * SR);
    if i >= len(buf): return
    n = min(len(sig), len(buf) - i); buf[i:i + n] += sig[:n] * g

def env(n, a=0.005, d=0.2, sus=0.0, r=0.05):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * (sus + (1 - sus) * np.exp(-t / max(d, 1e-4)))
    rel = int(r * SR);
    if rel and rel < n: e[-rel:] *= np.linspace(1, 0, rel)
    return e

from scipy.signal import lfilter
def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def lpv(x, fc, n=2):
    for _ in range(n): x = lp(x, fc)
    return x
def hp(x, fc): return x - lpv(x, fc, 1)
def bp(x, lo, hi): return lpv(hp(x, lo), hi, 2)
def noise(sec): return rng.standard_normal(int(sec * SR))
def tone(freq, sec, kind='sine', ph=0.0):
    t = np.arange(int(sec * SR)) / SR
    if np.isscalar(freq): p = 2 * np.pi * freq * t + ph
    else: p = 2 * np.pi * np.cumsum(freq) / SR + ph
    if kind == 'sine': return np.sin(p)
    if kind == 'saw': return 2 * ((p / (2 * np.pi)) % 1) - 1
    if kind == 'sq': return np.sign(np.sin(p))
    if kind == 'tri': return 2 * np.abs(2 * ((p / (2 * np.pi)) % 1) - 1) - 1
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ---------------- music ----------------
BPM = 112; BEAT = 60 / BPM
def kick():
    n = int(0.3 * SR); t = np.arange(n) / SR; f = 45 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9
def snare():
    n = int(0.18 * SR); t = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 900, 6000) * 2.2 * np.exp(-t * 22) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5) * 0.6
def tuba(m, sec):
    f = mtof(m); n = int(sec * SR)
    x = tone(f, sec, 'saw') * 0.6 + tone(f, sec, 'sine') * 0.6
    return lpv(x, 420, 2) * env(n, 0.012, 0.25, 0.35, 0.05)
def pah(ms, sec):  # brass chord stab
    n = int(sec * SR); x = np.zeros(n)
    for m in ms: x += tone(mtof(m) * (1 + 0.002 * rng.standard_normal()), sec, 'saw')
    return lpv(x / len(ms), 1500, 2) * env(n, 0.01, 0.12, 0.25, 0.04) * 0.7
def bell(m, sec=0.9):
    n = int(sec * SR); t = np.arange(n) / SR; f = mtof(m)
    return (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)) * np.exp(-t * 4.5) * 0.5
def pluck(m, sec=0.45):
    f = mtof(m); n = int(sec * SR); L = int(SR / f); buf = rng.uniform(-1, 1, L); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % L]; buf[i % L] = 0.5 * (buf[i % L] + buf[(i + 1) % L]) * 0.996
    return out * 0.6

# D major march: | D | G | A | D |  (bass roots, chords as MIDI)
PROG = [(38, [62, 66, 69]), (43, [62, 67, 71]), (45, [61, 64, 69]), (38, [62, 66, 69]),
        (38, [62, 66, 69]), (35, [62, 66, 71]), (45, [61, 64, 69]), (38, [62, 66, 69])]
MEL = [[74, None, 78, 76], [74, 71, None, 74], [76, None, 73, 69], [74, None, None, None],
       [78, None, 76, 74], [71, None, 74, 76], [73, 76, 73, 69], [74, None, 62, None]]

def march(t0, t1, gain=1.0, light=False):
    out = np.zeros(N); b = 0; t = t0
    while t < t1 - 0.01:
        bar, beat = (b // 4) % 8, b % 4
        root, ch = PROG[bar]
        if not light:
            if beat in (0, 2): place(out, kick(), t, 0.8)
            if beat in (1, 3): place(out, snare(), t, 0.55)
            place(out, bp(noise(0.04), 6000, 12000) * env(int(0.04 * SR), 0.001, 0.015), t + BEAT / 2, 0.25)  # hat on the &
        if beat in (0, 2): place(out, tuba(root if beat == 0 else root + 7, BEAT * 0.9), t, 0.9)
        else: place(out, pah(ch, BEAT * 0.7), t, 0.45 if not light else 0.3)
        m = MEL[bar][beat]
        if m: place(out, (bell(m) if light else pluck(m, 0.9) * 0.8 + bell(m, 0.9) * 0.35), t, 0.55)
        t += BEAT; b += 1
    # fade the edges
    i0, i1 = int(t0 * SR), int(t1 * SR); fi = int(0.04 * SR)
    out[i0:i0 + fi] *= np.linspace(0, 1, fi); out[max(i0, i1 - fi):i1] *= np.linspace(1, 0, min(fi, i1 - i0)); out[i1:] = 0
    return out * gain

music = np.zeros(N)
TW = T(1240)
music += march(0.0, TW)
# twist: everything stops, low drone + sting hit
dr_t = np.arange(int((T(1352) - TW) * SR)) / SR
drone = (np.sin(2 * np.pi * 36.7 * dr_t) + 0.5 * np.sin(2 * np.pi * 55 * dr_t) + 0.25 * np.sin(2 * np.pi * 73.4 * dr_t * (1 + 0.002 * np.sin(dr_t)))) * np.minimum(1, dr_t / 0.3)
drone *= np.minimum(1, (dr_t[-1] - dr_t) / 0.4) * 0.09
place(music, drone, TW)
# land reprise: light bells + tuba, ends with a button on "ships"
rep = march(T(1356), T(1489), 0.8, light=True)
music += rep
place(music, tuba(38, 0.6), T(1489), 1.1); place(music, pah([62, 66, 69, 74], 0.5), T(1489), 0.8); place(music, bell(74, 1.2), T(1489), 0.7)

# ---------------- sfx ----------------
sfx = np.zeros(N)
def whoosh(sec=0.7, up=True):
    n = int(sec * SR); t = np.linspace(0, 1, n); x = noise(sec)
    fc = 300 + 2500 * (t if up else 1 - t); y = np.zeros(n); s = 0.0
    for i in range(n): a = np.exp(-2 * np.pi * fc[i] / SR); s = (1 - a) * x[i] + a * s; y[i] = s
    return hp(y, 150) * np.sin(np.pi * t) ** 1.5 * 2.2
def splash(sec=1.2, big=1.0):
    n = int(sec * SR); t = np.arange(n) / SR
    body = lpv(noise(sec), 2500 * big, 2) * np.exp(-t * (4 / big)) * 2.0
    drops = np.zeros(n)
    for k in range(int(14 * big)):
        st = int(rng.uniform(0.05, sec * 0.8) * SR); m = int(0.04 * SR); f = rng.uniform(600, 1800)
        if st + m < n: drops[st:st + m] += np.sin(2 * np.pi * f * (1 + 2 * np.arange(m) / m) * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * 60) * 0.3
    return (body + drops) * np.minimum(1, t / 0.004)
def boom(sec=2.2):
    n = int(sec * SR); t = np.arange(n) / SR; f = 32 + 60 * np.exp(-t * 6)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) * 1.2 + lpv(noise(sec), 500, 2) * np.exp(-t * 3) * 2.5) * np.minimum(1, t / 0.003)
def rumble(sec=2.5):
    n = int(sec * SR); t = np.arange(n) / SR
    return lpv(noise(sec), 140, 3) * 9 * np.sin(np.pi * np.minimum(1, t / sec)) ** 0.7
def creak(sec=1.0, f0=110):
    n = int(sec * SR); t = np.arange(n) / SR; f = f0 * (1 + 0.25 * np.sin(2 * np.pi * 1.3 * t)) + 15 * rng.standard_normal(n).cumsum() / np.sqrt(n)
    x = tone(f, sec, 'saw') * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t) ** 2)
    return bp(x, 200, 1800) * np.sin(np.pi * t / sec) * 0.9
def bubbles(sec=1.2, dens=10):
    n = int(sec * SR); out = np.zeros(n)
    for k in range(int(dens * sec)):
        st = int(rng.uniform(0, sec - 0.08) * SR); m = int(0.07 * SR); f = rng.uniform(300, 900); tt = np.arange(m) / SR
        if st + m < n: out[st:st + m] += np.sin(2 * np.pi * f * (1 + 6 * tt) * tt) * np.exp(-tt * 45) * 0.45
    return out
def ting(m=88, sec=1.2): return bell(m, sec) * 1.2
def thunk(sec=0.3):
    n = int(sec * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (180 - 120 * t) * t) * np.exp(-t * 25) + bp(noise(sec), 300, 2500) * np.exp(-t * 60) * 1.5) * 0.9
def horn(sec=1.4):
    n = int(sec * SR); t = np.arange(n) / SR
    x = tone(110, sec, 'saw') + tone(138.6, sec, 'saw') * 0.8
    return lpv(x, 700, 2) * np.minimum(1, t / 0.08) * np.minimum(1, (sec - t) / 0.25) * 0.8
def hiss(sec=0.9):  # torpedo run / cat hiss
    n = int(sec * SR); t = np.arange(n) / SR
    return bp(noise(sec), 2500, 9000) * np.sin(np.pi * t / sec) ** 0.6 * 1.4
def brr(sec=0.8):  # shake-off flutter
    n = int(sec * SR); t = np.arange(n) / SR
    return bp(noise(sec), 400, 4000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 18 * t))) * np.sin(np.pi * t / sec) * 1.6
def step(sec=0.12):
    n = int(sec * SR); t = np.arange(n) / SR
    return bp(noise(sec), 150, 1200) * np.exp(-t * 50) * 1.3
def gull(sec=0.5):
    n = int(sec * SR); t = np.arange(n) / SR; f = 1300 + 500 * np.sin(np.pi * t / sec) - 600 * t
    return tone(f, sec, 'tri') * np.sin(np.pi * t / sec) ** 2 * 0.35
def bloop(sec=0.35):
    n = int(sec * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(500 * np.exp(-t * 7) + 120) / SR) * np.exp(-t * 9) * 0.9
def slosh(sec=0.6):
    n = int(sec * SR); t = np.arange(n) / SR
    return lpv(noise(sec), 1200, 2) * np.sin(np.pi * t / sec) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)) * 1.6
def tink(): n = int(0.4 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 2100 * t) + 0.5 * np.sin(2 * np.pi * 3400 * t)) * np.exp(-t * 18) * 0.5
def shimmer(sec=0.6):
    n = int(sec * SR); out = np.zeros(n)
    for k, m in enumerate([86, 90, 93, 98]): place(out, bell(m, sec) * 0.35, k * 0.04)
    return out

# water ambience for the sea shots (0 .. 1345), golden/dusk a bit stronger
amb_sec = T(1345); a = lpv(noise(amb_sec), 700, 2) * 2.2
tt = np.arange(len(a)) / SR; a *= 0.55 + 0.45 * np.sin(2 * np.pi * 0.23 * tt) ** 2
for k in range(int(amb_sec * 1.2)):  # lapping
    st = rng.uniform(0, amb_sec - 0.4); seg = bp(noise(0.35), 300, 1500) * np.sin(np.pi * np.arange(int(0.35 * SR)) / int(0.35 * SR)) * 0.8
    place(a, seg, st)
a[:int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR)); a[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))
place(sfx, a * 0.35, 0)

CUES = [  # (frame, sound, gain)
    (40, whoosh(1.4, False), 0.7),
    (152, shimmer(), 0.8), (153, whoosh(0.5), 0.6),
    (298, creak(1.2, 90), 0.9), (302, rumble(1.6), 0.9), (316, rumble(1.5), 1.0), (318, splash(1.6, 1.6), 1.0), (326, bubbles(1.0, 14), 0.8),
    (342, shimmer(), 0.8), (343, whoosh(0.5), 0.6),
    (360, horn(1.5), 0.6), (414, ting(91, 0.8), 0.6),
    (492, whoosh(0.4), 0.4), (513, thunk(), 1.0), (515, ting(88), 0.9),
    (532, shimmer(), 0.8), (533, whoosh(0.5), 0.6),
    (584, hiss(0.95), 0.8), (612, boom(2.4), 1.0), (613, splash(1.8, 1.8), 0.9), (630, creak(1.2, 75), 0.8), (640, rumble(1.0), 0.9), (642, splash(1.2, 1.3), 0.8),
    (667, splash(0.7, 0.6), 0.9), (674, splash(0.4, 0.4), 0.6), (668, bubbles(0.6, 12), 0.6),
    (762, whoosh(0.3), 0.3), (780, brr(0.85), 0.55), (806, ting(93), 0.8),
    (826, step(), 0.5), (841, step(), 0.5), (856, step(), 0.5), (871, step(), 0.5), (864, whoosh(1.3), 0.7), (880, gull(), 0.5), (893, gull(0.4), 0.4),
    (905, ting(86), 0.6), (934, whoosh(0.25), 0.25),
    (977, shimmer(), 0.8), (978, whoosh(0.5), 0.6),
    (1012, hiss(1.05), 0.8), (1042, boom(2.6), 1.0), (1043, splash(2.0, 2.0), 0.9), (1050, creak(1.4, 70), 0.85), (1060, rumble(1.3), 1.0), (1072, splash(1.4, 1.5), 0.85), (1076, bubbles(0.9, 14), 0.7),
    (1122, splash(0.8, 0.7), 1.0), (1174, brr(0.8), 0.9), (1214, hiss(0.75), 0.6),
    (1240, boom(2.8), 0.9), (1306, bubbles(1.2, 9), 0.6), (1314, bubbles(1.0, 9), 0.5), (1322, bubbles(1.0, 9), 0.5),
    (1342, shimmer(), 0.8), (1343, whoosh(0.5), 0.6),
    (1352, gull(), 0.5), (1372, gull(0.4), 0.4), (1401, thunk(0.25), 0.7),
    (1430, gull(0.45), 0.35),
    (1461, tink(), 0.9), (1463, slosh(), 0.7), (1487, bloop(), 1.0), (1490, bubbles(0.8, 12), 0.6),
]
for st in range(1345, 1392, 14): CUES.append((st, step(), 0.5))
for f, s, g in CUES: place(sfx, s, T(f), g)

write('audio/music.wav', music / (np.abs(music).max() + 1e-9) * 0.9)
write('audio/sfx.wav', sfx / (np.abs(sfx).max() + 1e-9) * 0.9)
print('music', len(music) / SR, 'sfx cues', len(CUES))
