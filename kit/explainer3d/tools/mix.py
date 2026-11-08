# Explainer mix at measured levels (skill: explainer-voice-and-reference):
#   music gated RMS = voice - 13 dB, SFX gated RMS <= voice - 10 dB with peaks <= 0.7 x voice peak; voice untouched.
#   Then one linear gain to -14 LUFS + -1 dBFS true-peak-ish limiter -> final.wav (48 kHz, 24-bit).
#   python mix.py voice.wav music.wav sfx.wav out_dir [music_db] [sfx_db]
import subprocess, sys, wave
import numpy as np

SR = 44100
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def gated_rms(x, win=0.4, hop=0.1):
    w, h = int(win * SR), int(hop * SR)
    p = np.array([np.mean(x[i:i + w] ** 2) for i in range(0, max(1, len(x) - w), h)]); p = p[p > 1e-6]
    if not len(p): return 1e-9
    rel = np.mean(p) * 0.01; return float(np.sqrt(np.mean(p[p > rel])))
db = lambda r: 20 * np.log10(max(r, 1e-12))
v, m, s = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3]); od = sys.argv[4]
mdb = float(sys.argv[5]) if len(sys.argv) > 5 else -13.0; sdb = float(sys.argv[6]) if len(sys.argv) > 6 else -10.0
n = max(len(v), len(m)); v, m, s = [np.pad(x, (0, n - len(x)))[:n] for x in (v, m, s)]
rv, vpk = gated_rms(v), np.abs(v).max()
M = m * (rv * 10 ** (mdb / 20) / gated_rms(m))
gs = min(rv * 10 ** (sdb / 20) / gated_rms(s), 0.7 * vpk / max(np.abs(s).max(), 1e-9)); X = s * gs
out = v + M + X
print(f'voice gated RMS {db(rv):.2f} dBFS | music {db(gated_rms(M)) - db(rv):+.1f} dB | sfx {db(gated_rms(X)) - db(rv):+.1f} dB, sfx peak {np.abs(X).max() / vpk:.2f} x voice peak')
y = (np.clip(out, -1, 1) * 8388607).astype(np.int32); b = np.zeros((n, 3), np.uint8); b[:, 0] = y & 255; b[:, 1] = (y >> 8) & 255; b[:, 2] = (y >> 16) & 255
with wave.open(f'{od}/mix.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes())
I = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{od}/mix.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float([l for l in I.splitlines() if l.strip().startswith('I:')][-1].split()[1]); G = -14 - I
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{od}/mix.wav', '-af', f'volume={G:.2f}dB,alimiter=limit=0.84:attack=5:release=60:level=false', '-ar', '48000', '-c:a', 'pcm_s24le', f'{od}/final.wav'], check=True)
chk = subprocess.run(['ffmpeg', '-hide_banner', '-i', f'{od}/final.wav', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
print(f'mix {I:.1f} LUFS -> gain {G:+.2f} dB ->', ' | '.join(l.strip() for l in chk.splitlines() if l.strip().startswith(('I:', 'Peak:')))[-80:])
