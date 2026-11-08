# mix.py voice.mp3 music.wav sfx.wav -> audio/mix.wav
# Music gated RMS = 50 % of the voice gated RMS (-6.0 dB). SFX gated RMS = 50 % (or less) with peaks <= 0.7 x voice peak.
# No ducking, no compression: the voice is untouched.
import sys, subprocess, numpy as np, wave
SR = 44100
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def gated_rms(x, win=0.4, hop=0.1):
    w, h = int(win * SR), int(hop * SR)
    p = np.array([np.mean(x[i:i + w] ** 2) for i in range(0, max(1, len(x) - w), h)])
    p = p[p > 10 ** (-60 / 10)]
    if not len(p): return 0.0
    rel = np.mean(p) * 10 ** (-20 / 10)
    return float(np.sqrt(np.mean(p[p > rel])))
db = lambda r: 20 * np.log10(max(r, 1e-12))
v, m, s = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3])
n = len(v); m = np.pad(m, (0, max(0, n - len(m))))[:n]; s = np.pad(s, (0, max(0, n - len(s))))[:n]
rv, vpk = gated_rms(v), np.abs(v).max()
gm = 0.5 * rv / gated_rms(m)
gs = 0.5 * rv / gated_rms(s)
gs = min(gs, 0.7 * vpk / np.abs(s).max())
M, X = m * gm, s * gs
out = v + M + X
print(f'voice gated RMS {db(rv):.2f} dBFS, peak {db(vpk):.2f} dBFS')
print(f'music vs voice: {db(gated_rms(M)) - db(rv):+.2f} dB (target -6.0)')
print(f'sfx   vs voice: {db(gated_rms(X)) - db(rv):+.2f} dB (target <= -6.0), sfx peak {np.abs(X).max() / vpk:.2f} x voice peak')
y = (np.clip(out, -1, 1) * 8388607).astype(np.int32)
b = np.zeros((n, 3), dtype=np.uint8); b[:, 0] = y & 255; b[:, 1] = (y >> 8) & 255; b[:, 2] = (y >> 16) & 255
with wave.open('audio/mix.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes())
print('wrote audio/mix.wav', n / SR, 's')
