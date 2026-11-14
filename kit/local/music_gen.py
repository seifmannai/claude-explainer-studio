"""Generate an original deadpan-comedy music bed (plucked strings + walking bass + soft marimba + brushes).
No samples, no downloads: everything is synthesised with numpy, so it is ours to use.

  python music_gen.py <out.wav> <seconds> [bpm]
  python music_gen.py <out.wav> <seconds> --soft   soft bed for under narration (video 3 v2 rule: no drums, no bright
                                                   plucks; slow warm chords, sub bass, a sparse quiet bell line)
"""
import sys, numpy as np, soundfile as sf

SR = 48000
rng = np.random.default_rng(7)

def pluck(freq, dur, bright=0.5, amp=1.0):
    # Karplus-Strong string: reads like pizzicato
    n = int(SR * dur); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p) * amp; out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * (0.994 + 0.004 * bright)
    return out

def marimba(freq, dur, amp=0.5):
    t = np.arange(int(SR * dur)) / SR
    env = np.exp(-t * 7)
    return amp * env * (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t * 20))

def brush(dur, amp=0.15):
    n = int(SR * dur); t = np.arange(n) / SR
    x = rng.normal(0, 1, n) * np.exp(-t * 30)
    x = np.diff(np.concatenate([[0], x]))          # brighter
    return amp * x

def midi(m): return 440 * 2 ** ((m - 69) / 12)

def main(out, seconds, bpm=104):
    beat = 60 / bpm; total = int(SR * (seconds + 2)); mix = np.zeros((total, 2))
    def put(sig, t, pan=0.0, g=1.0):
        i = int(t * SR); j = min(total, i + len(sig))
        if i >= total: return
        s = sig[: j - i] * g; mix[i:j, 0] += s * (1 - pan) * 0.7; mix[i:j, 1] += s * (1 + pan) * 0.7
    # 4-bar loop in D minor-ish, sly and dry: i - iv - VII - V
    chords = [[50, 53, 57], [55, 58, 62], [48, 52, 55], [57, 61, 64]]
    bass = [[38, 45, 41, 45], [43, 50, 46, 50], [36, 43, 40, 43], [45, 52, 49, 45]]
    melody = [74, None, 77, 76, None, 74, None, 72, 69, None, 72, None, 73, None, 76, None]
    t = 0.0; bar = 0
    while t < seconds:
        c = chords[bar % 4]; b = bass[bar % 4]
        for k in range(4):                                   # walking pizzicato bass, one per beat
            put(pluck(midi(b[k]), beat * 0.9, 0.3, 0.9), t + k * beat, -0.15, 0.9)
        for k in (1, 3):                                     # offbeat plucked chord stabs
            for i, m in enumerate(c): put(pluck(midi(m + 12), beat * 0.5, 0.8, 0.5), t + k * beat + 0.012 * i, 0.25, 0.35)
        if bar % 8 >= 4:                                     # marimba tune every other phrase
            for k, m in enumerate(melody[(bar % 2) * 8:(bar % 2) * 8 + 8]):
                if m: put(marimba(midi(m), beat * 0.6), t + k * beat / 2, 0.3, 0.45)
        for k in range(8):                                   # brushes on 8ths, accent 2 and 4
            put(brush(0.12, 0.10 if k % 2 else 0.05), t + k * beat / 2, 0.4, 1.0 + (0.6 if k in (2, 6) else 0))
        t += 4 * beat; bar += 1
    mix = mix[: int(SR * seconds)]
    # gentle tone: low-cut 60 Hz, soft saturation, normalise to -3 dBFS
    from scipy.signal import butter, sosfilt
    mix = sosfilt(butter(2, 60, 'hp', fs=SR, output='sos'), mix, axis=0)
    mix = np.tanh(mix * 1.2); mix *= 10 ** (-3 / 20) / (np.abs(mix).max() + 1e-9)
    fade = int(SR * 1.5); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    sf.write(out, mix.astype(np.float32), SR, subtype='PCM_24'); print('music', out, seconds, 's', bpm, 'bpm')

def soft(seconds, out):
    # 64 bpm, 4 bars per chord loop: Am9 - Fmaj7 - Cmaj7 - G6. Each voice: sine + a little 2nd/3rd harmonic, slow attack
    t = np.arange(int(SR * seconds)) / SR; y = np.zeros(len(t)); bar = 60 / 64 * 4
    chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    for b in range(int(seconds / bar) + 1):
        ch = chords[b % 4]; t0 = b * bar; i0, i1 = int(t0 * SR), min(len(t), int((t0 + bar * 1.15) * SR))
        if i0 >= len(t): break
        u = t[i0:i1] - t0; env = np.minimum(u / 0.9, 1) * np.exp(-np.maximum(u - bar * 0.7, 0) / 0.5)
        for k, m in enumerate(ch):
            f = mtof(m) * (1 + 0.002 * np.sin(2 * np.pi * (0.2 + 0.05 * k) * u))
            y[i0:i1] += (np.sin(2 * np.pi * f * u) + 0.12 * np.sin(4 * np.pi * f * u) + 0.04 * np.sin(6 * np.pi * f * u)) * env * 0.12
        fb = mtof(ch[0] - 12); y[i0:i1] += np.sin(2 * np.pi * fb * u) * env * 0.22                     # sub bass
        for q in (1, 3) if b % 2 else (2,):                                                             # sparse quiet bell
            j0 = int((t0 + q * bar / 4) * SR); j1 = min(len(t), j0 + int(1.6 * SR))
            if j0 < len(t): v = t[j0:j1] - t[j0]; fm = mtof(ch[(b + q) % len(ch)] + 12)
            if j0 < len(t): y[j0:j1] += np.sin(2 * np.pi * fm * v) * np.exp(-v / 0.5) * 0.05
    y = y / (np.abs(y).max() + 1e-9) * 0.5
    sf.write(out, np.stack([y, np.roll(y, 240)], 1).astype(np.float32), SR); print('soft music ->', out)

if __name__ == '__main__':
    if '--soft' in sys.argv: soft(float(sys.argv[2]), sys.argv[1]); sys.exit(0)
    main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]) if len(sys.argv) > 3 else 104)
