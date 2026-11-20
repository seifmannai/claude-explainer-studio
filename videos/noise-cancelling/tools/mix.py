# mix.py - sound for "How noise-cancelling headphones erase sound": voice + designed noise + SFX + a soft bed.
# The point of the film is HEARD: the metro noise is loud until Dave taps the button, then it drops ~24 dB and goes
# muffled (low-pass), exactly like noise cancelling. In 3D the train hum plays while the waves are apart and vanishes on
# "cancel out". Cues come from film/cues.js through node (same times as the picture). Writes stems + mix for VideoHub.
#   python mix.py voice.wav cues.json film/audio/mix.wav
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
voice_path, cues_path, out = sys.argv[1:4]
SR = 44100
v, vsr = sf.read(voice_path, dtype='float32')
if v.ndim > 1: v = v.mean(1)
if vsr != SR: v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v).astype(np.float32)
C = json.load(open(cues_path)); N = int(C['DUR'] * SR) + SR // 2
rng = np.random.default_rng(5)
T = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.uniform(-1, 1, int(d * SR))
def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos'); return sosfilt(sos, x)
def env(n, a=0.005, r=0.05):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na); nr = min(n, int(r * SR)); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e
def ramp(t0, t1, n=N):   # 0 before t0 -> 1 after t1
    t = np.arange(n) / SR; return np.clip((t - t0) / max(1e-3, t1 - t0), 0, 1)
fx = np.zeros(N); bed = np.zeros(N)
def put(at, s, gain=1.0, buf=None):
    buf = fx if buf is None else buf; i = int(at * SR)
    if i < 0: s = s[-i:]; i = 0
    if i >= N: return
    s = s[:N - i]; buf[i:i + len(s)] += s * gain
c = C
# ---------------- the metro (0 .. dive1, back0 .. end): rumble + clatter + crowd, then noise cancelling
t = np.arange(N) / SR
rumble = filt(noise(N / SR), 'lowpass', 110) * 3.0 + 0.25 * np.sin(2 * np.pi * 55 * t) * (0.7 + 0.3 * np.sin(t * 1.3))
clack = np.zeros(N)
for k in np.arange(0.12, C['DUR'], 0.42): put(k, filt(noise(0.06), 'bandpass', [300, 1800]) * env(int(0.06 * SR), 0.001, 0.05) * (1.2 if int(k / 0.42) % 2 else 0.8), 1, clack)
crowd = filt(noise(N / SR), 'bandpass', [300, 2500]) * 0.25
metro = rumble + clack + crowd
inside3d = (t >= c['dive1']) & (t < c['back0'])
quiet = ramp(c['button'] - 0.02, c['gone'] + 0.25) * (t < c['back0'] - 0.5) + (t >= c['back0'])     # noise cancelling on
muffled = filt(metro, 'lowpass', 180, 4)
metro_out = metro * (1 - quiet) + muffled * quiet * 0.07
metro_out *= ~inside3d * 1.0 + inside3d * 0.0
fade_in3d = np.clip(1 - (t - c['dive0']) / max(0.1, c['dive1'] - c['dive0']), 0, 1)
metro_out = np.where((t >= c['dive0']) & (t < c['dive1']), metro_out * fade_in3d, metro_out)
bed += metro_out
# baby (a wailing saw through a formant), brakes (squealing sines + noise), chips crunch
def baby(d):
    tt = T(d); f = 520 + 120 * np.sin(2 * np.pi * 1.6 * tt) + 40 * np.sin(2 * np.pi * 6 * tt); ph = 2 * np.pi * np.cumsum(f) / SR
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1; y = filt(saw, 'bandpass', [700, 2600]) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 0.9 * tt))); return y * env(len(tt), 0.05, 0.2)
def brakes(d):
    tt = T(d); y = sum(np.sin(2 * np.pi * (f + 60 * np.sin(tt * 7 + i)) * tt) for i, f in enumerate([3100, 3720, 4410])) / 3
    return (y * 0.6 + filt(noise(d), 'highpass', 3000) * 0.3) * env(len(tt), 0.08, 0.3)
def crunch():
    tt = T(0.12); return filt(noise(0.12), 'bandpass', [1500, 6000]) * np.exp(-tt * 30) * (rng.uniform(0.5, 1.0))
duck = lambda k: 1 - 0.93 * float(np.clip((k - c['button']) / 0.6, 0, 1)) if k < c['dive1'] else 0.07
put(0.0, baby(c['taps'] + 1.0) * 0.5 * np.concatenate([np.ones(int(c['button'] * SR)), np.linspace(1, 0.06, int(0.6 * SR)), 0.06 * np.ones(int(2.0 * SR))])[:int((c['taps'] + 1.0) * SR)])
put(c['baby'] - 0.1, baby(1.6) * 0.6)
put(c['brakes'] - 0.1, brakes(c['button'] - c['brakes'] + 0.2), 0.55)
for k in np.arange(c['rush'], c['gone'], 0.23): put(k, crunch(), 0.5 * duck(k))
# ANC on: a click, then the "air pressure" whoomp into silence
put(c['button'] - 0.01, filt(noise(0.02), 'highpass', 2000) * env(int(0.02 * SR), 0.0005, 0.015) * 1.2)
put(c['button'], np.sin(2 * np.pi * np.cumsum(np.linspace(900, 1400, int(0.08 * SR))) / SR) * env(int(0.08 * SR), 0.002, 0.05) * 0.35)
put(c['button'] + 0.05, filt(noise(1.0), 'lowpass', 300) * np.linspace(1, 0, int(1.0 * SR)) ** 2 * 1.2)
# dive into the cup: a whoosh that rises, then a soft impact as we land in the 3D studio
d = c['dive1'] - c['dive0']; ww = filt(noise(d), 'bandpass', [200, 3000]) * np.linspace(0, 1, int(d * SR)) ** 2; put(c['dive0'], ww * 0.8)
put(c['dive1'], filt(noise(0.5), 'lowpass', 400) * np.exp(-T(0.5) * 9) * 1.4)
# ---------------- 3D: parts click apart, the train hum (the wave) appears and is cancelled
for i, k in enumerate(np.linspace(c['explode'] + 0.2, c['mic'] - 0.1, 7)): put(k, np.sin(2 * np.pi * (1400 + i * 120) * T(0.05)) * np.exp(-T(0.05) * 90) * 0.35)
hum_t = np.arange(N) / SR
hum = (0.6 * np.sin(2 * np.pi * 110 * hum_t) + 0.3 * np.sin(2 * np.pi * 220 * hum_t + 0.5) + 0.1 * np.sin(2 * np.pi * 330 * hum_t)) * 0.18
hum_gain = ramp(c['mic'], c['listens'] + 0.3) * (1 - ramp(c['cancel'] - 0.15, c['cancel'] + 0.25))
bed += hum * hum_gain
put(c['copies'], np.sin(2 * np.pi * np.cumsum(np.linspace(600, 900, int(0.25 * SR))) / SR) * env(int(0.25 * SR), 0.01, 0.1) * 0.25)
put(c['flips'], np.sin(2 * np.pi * np.cumsum(np.linspace(900, 450, int(0.35 * SR))) / SR) * env(int(0.35 * SR), 0.01, 0.15) * 0.3)
put(c['plays'], filt(noise(0.8), 'bandpass', [150, 900]) * env(int(0.8 * SR), 0.05, 0.4) * 0.35)
put(c['silence'] - 0.05, np.sin(2 * np.pi * 1760 * T(1.2)) * np.exp(-T(1.2) * 3.5) * 0.18)
for k in np.arange(c['checks'], c['steady'] - 0.2, 0.09): put(k, np.sin(2 * np.pi * 2600 * T(0.02)) * np.exp(-T(0.02) * 200) * 0.18)
steady = (np.sin(2 * np.pi * 70 * hum_t) * 0.5 + np.sin(2 * np.pi * 140 * hum_t) * 0.2) * 0.25
bed += steady * ramp(c['steady'] - 0.2, c['steady'] + 0.2) * (1 - ramp(c['engines'] - 0.3, c['engines'] + 0.3))
put(c['engines'], np.sin(2 * np.pi * 1320 * T(0.6)) * np.exp(-T(0.6) * 6) * 0.22)
sharp = np.sign(np.sin(2 * np.pi * 1900 * hum_t)) * 0.05 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * hum_t)))
bed += sharp * ramp(c['high'] - 0.1, c['high'] + 0.1) * (1 - ramp(c['cushions'] - 0.2, c['cushions']))
put(c['tooFast'], (filt(noise(0.25), 'bandpass', [200, 800]) * np.exp(-T(0.25) * 14)) * 0.8)            # "nope" thud
for k in np.arange(c['cushions'], c['back0'] - 0.3, 0.62): put(k, filt(noise(0.15), 'lowpass', 250) * np.exp(-T(0.15) * 25) * 0.9)   # waves hit the soft cushion
put(c['back0'] - 0.25, filt(noise(0.35), 'bandpass', [300, 4000]) * np.linspace(1, 0, int(0.35 * SR)) * 0.7)
# ---------------- ending: muffled station chime, doors close, the "!!" sting, loop whoosh
chime = lambda f: np.sin(2 * np.pi * f * T(0.9)) * np.exp(-T(0.9) * 4)
put(c['nothing'] - 0.2, filt(np.concatenate([chime(660), chime(523)]), 'lowpass', 900) * 0.12)
put(c['stop'] - 0.2, filt(noise(0.5), 'lowpass', 300) * env(int(0.5 * SR), 0.02, 0.3) * 0.5)
put(c['stop'] + 0.3, np.sin(2 * np.pi * np.cumsum(np.linspace(300, 1200, int(0.3 * SR))) / SR) * env(int(0.3 * SR), 0.005, 0.1) * 0.3)
lw = c['DUR'] - c['loopA']; put(c['loopA'], filt(noise(lw), 'bandpass', [300, 3000]) * np.sin(np.pi * np.linspace(0, 1, int(lw * SR))) * 0.8)
# ---------------- music: a soft, bright pad only in the calm parts (after the button), ~19 dB under the voice
chords = [[57, 64, 69, 76], [53, 60, 65, 72], [55, 62, 67, 74], [52, 59, 64, 71]]
mus = np.zeros(N)
for j, k0 in enumerate(np.arange(0, C['DUR'], 2.4)):
    a, b = int(k0 * SR), min(N, int((k0 + 2.6) * SR)); tt = np.arange(b - a) / SR
    for i, m in enumerate(chords[j % 4]): f = 440 * 2 ** ((m - 69) / 12); mus[a:b] += np.sin(2 * np.pi * f * tt + i) * (0.7 + 0.3 * np.sin(tt * 2 + i)) * np.minimum(1, tt / 0.3) * np.minimum(1, (tt[-1] - tt) / 0.3)
mus = filt(mus, 'lowpass', 2500)
music_gain = ramp(c['gone'] - 0.2, c['gone'] + 0.6) * (1 - ramp(c['stop'] - 0.1, c['stop'] + 0.2))
for k, d in [('cancel', 0.9), ('tooFast', 0.6)]: music_gain *= 1 - np.exp(-((t - c[k] - d / 2) / (d / 2)) ** 8)   # out on the key beats
vv = np.zeros(N); vv[:min(N, len(v))] = v[:N]
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2) + 1e-12)
mus *= music_gain * rms(vv) / rms(mus) * 10 ** (-19 / 20)
bed *= rms(vv) / rms(bed[:int(c['button'] * SR)]) * 10 ** (-6 / 20)       # the noise is LOUD before the button (6 dB under the voice)
fx *= rms(vv) / max(rms(fx), 1e-9) * 10 ** (-8 / 20)
sfx = bed + fx
mix = vv + sfx + mus; pk = max(1.0, np.abs(mix).max() / 0.95); mix /= pk
d = os.path.dirname(out); os.makedirs(d, exist_ok=True)
w = lambda name, x: sf.write(os.path.join(d, name), np.stack([x, x], 1).astype(np.float32), SR, subtype='PCM_16')
w(os.path.basename(out), mix); w('voice.wav', vv / pk); w('sfx.wav', sfx / pk); w('music.wav', mus / pk)
json.dump({'cues': [{'t': round(val, 3), 'name': k} for k, val in c.items() if isinstance(val, (int, float)) and k != 'DUR']}, open(os.path.join(d, 'cues.json'), 'w'))
print('mix', out, round(N / SR, 2), 's')
# loudness for Shorts: -14 LUFS integrated, -1.5 dBTP (ffmpeg loudnorm, two-pass not needed for a 45 s mix)
import subprocess, shutil
tmp = out + '.tmp.wav'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', out, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), tmp], check=True)
shutil.move(tmp, out); print('loudnorm -14 LUFS')
