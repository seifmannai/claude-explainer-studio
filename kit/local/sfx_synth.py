"""Synthesised sound effects the CC0 kit does not have (all ours: numpy only).

  python sfx_synth.py <out_dir>      writes 48 kHz stereo WAVs:
    rewind.wav (0.85 s tape rewind, pitch falls)  forward.wav (0.75 s, pitch rises)  projector.wav (10.6 s film projector bed, faded ends)
    chop.wav (axe into rope/wood)  ratchet.wav (4 pawl clicks)  clunk.wav (safety catch locks: thump + metal ring)
    gasp.wav  murmur.wav  cheer.wav (crowd beds, filtered noise; placeholders until real CC0 crowd recordings are found)"""
import os, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
SR = 48000; rng = np.random.default_rng(3)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def tt(L): return np.arange(int(L * SR)) / SR
def sweep(L, f0, f1):
    t = tt(L); f = np.geomspace(f0, f1, len(t)) * (1 + 0.08 * np.sin(2 * np.pi * 23 * t))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + bp(rng.normal(size=len(t)), 300, 4000) * 0.6
    return x * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.7
def projector(L=10.6):
    n = int(L * SR); x = np.zeros(n); k = np.arange(int(0.004 * SR)); click = rng.normal(size=len(k)) * np.exp(-k / (0.001 * SR))
    for i in range(int(L * 24)): j = int(i / 24 * SR); x[j:j + len(k)] += click[: n - j] * (0.6 + 0.4 * (i % 2))
    t = tt(L); return (bp(x, 600, 5000) * 0.6 + 0.08 * np.sin(2 * np.pi * 50 * t)) * np.minimum(np.minimum(t / 0.3, 1), np.minimum((L - t) / 0.4, 1))
def chop():
    t = tt(0.35); return 0.6 * np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.07) + 0.5 * bp(rng.normal(size=len(t)), 1500, 6000) * np.exp(-t / 0.02)
def ratchet():
    x = np.zeros(int(0.4 * SR)); t = tt(0.06); c = (np.sin(2 * np.pi * 2600 * t) + np.sin(2 * np.pi * 3900 * t)) * np.exp(-t / 0.012) * 0.4
    for d in (0.0, 0.08, 0.16, 0.23): j = int(d * SR); x[j:j + len(c)] += c
    return x
def clunk():
    t = tt(0.9); return 0.7 * np.sin(2 * np.pi * 58 * t) * np.exp(-t / 0.12) + 0.15 * sum(np.sin(2 * np.pi * f * t) for f in (690, 1130, 1720)) * np.exp(-t / 0.3)
def crowd(L, lo, hi, a, d):
    x = bp(rng.normal(size=int(L * SR)), lo, hi); t = tt(L); am = 1 + 0.5 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 1.3 * t)
    return x * am * np.minimum(t / a, 1) * np.exp(-t / d)
if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for name, x in dict(rewind=sweep(0.85, 2200, 300), forward=sweep(0.75, 300, 2200), projector=projector(), chop=chop(), ratchet=ratchet(), clunk=clunk(),
                        gasp=crowd(0.6, 700, 3500, 0.05, 0.25), murmur=crowd(1.0, 500, 3000, 0.02, 0.4), cheer=crowd(1.8, 300, 3000, 0.05, 0.8)).items():
        x = x / (np.abs(x).max() + 1e-9) * 0.7; sf.write(os.path.join(out, name + '.wav'), np.stack([x, x], 1).astype(np.float32), SR)
    print('synth sfx ->', out)
