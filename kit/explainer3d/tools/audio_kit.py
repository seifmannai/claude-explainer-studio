# Original music + SFX synthesized in numpy (no samples, no copyright claims), driven by the page's sound cues.
#   python audio_kit.py events.json sentences.json out_dir [--sections sections.json]
# events.json: window.events() from the page ([{t, type, v}]); writes out_dir/music.wav and out_dir/sfx.wav (44.1 kHz mono).
# sections.json (optional): [{"t": 0, "mode": "drive"}, ...] modes: drive, calm, groove, break, outro. Default: built from cues.
import json, sys
import numpy as np
from scipy.signal import lfilter

SR = 44100
rng = np.random.default_rng(11)

def write(path, x):
    import wave
    y = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes())
def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def lp2(x, fc): return lp(lp(x, fc), fc)
def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return lp2(hp(x, lo), hi)
def env(n, a=0.005, d=0.3, r=0.02):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4)); k = int(r * SR)
    if 0 < k < n: e[-k:] *= np.linspace(1, 0, k)
    return e
def place(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf): return
    n = min(len(sig), len(buf) - i); buf[i:i + n] += sig[:n] * g
def saw(f, n, ph=0.0): t = np.arange(n) / SR; return 2 * ((t * f + ph) % 1) - 1
def sine(f, n): return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (n,)) / SR))
note = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- SFX ----------------
def s_fire(v):      # one combustion pulse while the engine runs: low thump + short noise
    n = int(0.16 * SR); return (sine(np.linspace(95, 45, n), n) * env(n, 0.002, 0.06) + bp(rng.standard_normal(n), 150, 1800) * env(n, 0.001, 0.03) * 0.5) * (0.35 + 0.65 * v)
def s_valve(v):     # metallic tick
    n = int(0.08 * SR); return (sine(3100, n) * 0.5 + sine(5200, n) * 0.3 + hp(rng.standard_normal(n), 3000) * 0.4) * env(n, 0.0005, 0.012) * v
def s_spark():      # electric snap + crackle
    n = int(0.35 * SR); x = hp(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.03)
    for k in range(6): place(x, hp(rng.standard_normal(int(0.01 * SR)), 4000) * 0.6, 0.02 + k * 0.035 + rng.random() * 0.02)
    return x * 0.9
def s_whoomp():     # ignition: gas catching fire
    n = int(1.2 * SR); body = lp2(rng.standard_normal(n), 900) * env(n, 0.04, 0.35)
    return body * 1.6 + sine(np.linspace(70, 40, n), n) * env(n, 0.02, 0.4) * 0.6
def s_slam():       # piston slammed down: deep boom + metallic ring
    n = int(1.6 * SR); boom = sine(np.linspace(85, 30, n), n) * env(n, 0.003, 0.45)
    ring = (sine(420, n) + 0.6 * sine(1130, n) + 0.3 * sine(2310, n)) * env(n, 0.001, 0.25) * 0.18
    return boom + lp2(rng.standard_normal(n), 400) * env(n, 0.002, 0.12) * 0.8 + ring
def s_hiss(dur, lo, hi, a=0.3):  # airflow (intake / exhaust)
    n = int(dur * SR); x = bp(rng.standard_normal(n), lo, hi)
    e = np.minimum(1, np.arange(n) / (a * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR)); return x * e * 2.2
def s_squeeze(dur):  # compression: slowly rising tone under the narration
    n = int(dur * SR); f = np.linspace(110, 330, n); x = (saw(0, n) * 0 + sine(f, n) * 0.5 + sine(f * 2.01, n) * 0.2)
    return lp(x, 900) * np.linspace(0, 1, n) ** 1.5 * np.minimum(1, (n - np.arange(n)) / (0.3 * SR)) * 0.8
def s_whoosh():
    n = int(0.9 * SR); x = rng.standard_normal(n); e = np.sin(np.pi * np.arange(n) / n) ** 2
    cut = 300 + 3500 * e; y = np.zeros(n); a = np.exp(-2 * np.pi * cut / SR); s = 0.0
    for i in range(n): s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y * e * 1.8
def s_pop():        # UI pop for callouts
    n = int(0.12 * SR); return sine(np.linspace(900, 1500, n), n) * env(n, 0.001, 0.035) * 0.6
def s_sizzle(dur):
    n = int(dur * SR); x = hp(rng.standard_normal(n), 3500) * (rng.random(n) > 0.985) * 3 + bp(rng.standard_normal(n), 2000, 6000) * 0.25
    return x * np.minimum(1, np.arange(n) / (0.8 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.8 * SR)) * 0.7
def s_riser(dur):
    n = int(dur * SR); x = bp(rng.standard_normal(n), 800, 5000) * np.linspace(0, 1, n) ** 2 + sine(np.linspace(300, 900, n), n) * np.linspace(0, 1, n) ** 3 * 0.3
    return x * 1.2
def s_chime():
    n = int(1.6 * SR); return sum(sine(note(m), n) * env(n, 0.002, 0.6) * g for m, g in [(86, 0.5), (93, 0.35), (98, 0.25)])

def sfx(events, dur):
    out = np.zeros(int(dur * SR) + SR)
    rpm = {e['t']: e['v'] for e in events if e['type'] == 'rpm'}
    for e in events:
        k, t, v = e['type'], e['t'], e['v']
        if k == 'fire': place(out, s_fire(v), t, 0.9)
        elif k == 'valve': place(out, s_valve(v), t, 0.5)
        elif k == 'spark': place(out, s_spark(), t, 1.0)
        elif k == 'whoomp': place(out, s_whoomp(), t, 0.8)
        elif k == 'slam': place(out, s_slam(), t, 1.0)
        elif k == 'intake': place(out, s_hiss(v, 300, 2500), t, 0.5)
        elif k == 'exhaust': place(out, s_hiss(v, 120, 1200), t, 0.7)
        elif k == 'squeeze': place(out, s_squeeze(v), t, 0.5)
        elif k == 'whoosh': place(out, s_whoosh(), t - 0.3, 0.6)
        elif k == 'pop': place(out, s_pop(), t, 0.7)
        elif k == 'sizzle': place(out, s_sizzle(v), t, 0.6)
        elif k == 'riser': place(out, s_riser(v), t, 0.5)
        elif k == 'chime': place(out, s_chime(), t, 0.6)
    # engine hum that follows crank speed (only while it spins)
    ts = np.array(sorted(rpm)); ws = np.array([rpm[t] for t in ts])
    if len(ts):
        tt = np.arange(len(out)) / SR; w = np.interp(tt, ts, ws, left=0, right=ws[-1])
        f = 30 + 3.2 * np.abs(w); hum = lp2(saw(0, len(out)) * 0 + np.sign(np.sin(2 * np.pi * np.cumsum(f / SR))), 260) * np.clip(np.abs(w) / 20, 0, 1) ** 1.3
        out += hum * 0.18
    return out

# ---------------- music: original 96 BPM explainer bed, layers switched by section ----------------
def music(sections, dur, bpm=96):
    n = int(dur * SR) + SR; out = np.zeros(n); beat = 60 / bpm; bar = 4 * beat
    prog = [(50, [62, 65, 69]), (46, [62, 65, 70]), (53, [60, 65, 69]), (48, [60, 64, 67])]   # Dm Bb F C
    def mode_at(t):
        m = sections[0]['mode']
        for s in sections:
            if t >= s['t']: m = s['mode']
        return m
    nb = int(dur / beat) + 2
    for b in range(nb):
        t = b * beat; m = mode_at(t); root, ch = prog[(b // 8) % 4]
        if m == 'break' and mode_at(t + beat) == 'break' and t < sections[-1]['t'] - 1: pass
        # pad (every bar)
        if b % 4 == 0:
            L = int(bar * SR * 1.05); pad = sum(lp(saw(note(x), L, 0.1 * j) + saw(note(x) * 1.004, L), 1400 if m != 'calm' else 900) for j, x in enumerate(ch))
            e = np.minimum(1, np.arange(L) / (0.35 * SR)) * np.minimum(1, (L - np.arange(L)) / (0.3 * SR))
            place(out, pad * e * 0.07 * (1.3 if m in ('calm', 'outro', 'break') else 1), t)
        if m in ('drive', 'groove'):
            k = int(0.35 * SR)
            if b % 2 == 0: place(out, sine(np.linspace(120, 42, k), k) * env(k, 0.002, 0.16) * 0.55, t)                      # kick
            for h in (0, 0.5): hh = int(0.05 * SR); place(out, hp(rng.standard_normal(hh), 7000) * env(hh, 0.001, 0.012) * 0.25, t + h * beat)  # hats
            bl = int(beat * SR * 0.48); place(out, lp(saw(note(root - 12), bl), 500) * env(bl, 0.005, 0.2) * 0.22, t)           # bass
            bl2 = bl; place(out, lp(saw(note(root - 12), bl2), 500) * env(bl2, 0.005, 0.2) * 0.16, t + beat / 2)
        if m in ('drive', 'groove', 'outro', 'calm'):
            arp = ch + [ch[0] + 12]; step = beat / (4 if m == 'drive' else 2)
            for j in range(4 if m == 'drive' else 2):
                pl = int(0.22 * SR); f = note(arp[(b * 4 + j) % len(arp)] + 12)
                place(out, lp(saw(f, pl) * 0.6 + sine(f * 2, pl) * 0.3, 2600) * env(pl, 0.002, 0.09) * (0.09 if m != 'calm' else 0.06), t + j * step)
        if m == 'break' and b % 4 == 0:
            L = int(bar * SR); place(out, sine(note(root - 24), L) * np.minimum(1, np.arange(L) / (0.5 * SR)) * np.exp(-np.arange(L) / (2.5 * SR)) * 0.25, t)
    # final resolve: long Dm add9 swell at the end
    L = int(3.0 * SR); fin = sum(lp(saw(note(x), L) + saw(note(x) * 1.003, L), 1100) for x in (62, 65, 69, 76))
    place(out, fin * np.minimum(1, np.arange(L) / (0.4 * SR)) * np.exp(-np.arange(L) / (1.4 * SR)) * 0.06, max(0, dur - 2.6))
    tail = int(0.8 * SR); out[int(dur * SR) - tail:int(dur * SR)] *= np.linspace(1, 0, tail); out[int(dur * SR):] = 0
    return out

if __name__ == '__main__':
    events = json.load(open(sys.argv[1])); sents = json.load(open(sys.argv[2])); od = sys.argv[3]
    dur = max(s['t1'] for s in sents) + 1.1
    if '--sections' in sys.argv: sections = json.load(open(sys.argv[sys.argv.index('--sections') + 1]))
    else: sections = [{'t': 0, 'mode': 'drive'}]
    write(f'{od}/music.wav', music(sections, dur)); write(f'{od}/sfx.wav', sfx(events, dur))
    print('music + sfx ->', od, f'{dur:.2f} s')
