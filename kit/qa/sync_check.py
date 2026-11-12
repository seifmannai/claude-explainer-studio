"""Voice / word-timing sync check (skills/ours/always-alive-3d, gate 1).

  python sync_check.py <voice.wav> <words.json> [--max 0.08] [--fix fixed_words.json]

words.json: [{"w": word, "t": start, "end": end, "s": sentence_index}, ...].
Finds real speech onsets in the waveform (energy envelope) and compares every sentence's first word with the
nearest onset. Prints the offenders; exit code 1 if any sentence is off by more than --max seconds.
--fix writes a corrected copy: each sentence is shifted (and scaled to its real end) so it starts on its onset.
Lesson from video 3: Whisper alignment ran 0.35 s early on average and up to 1.5 s off; nobody measured it."""
import argparse, json, sys
import numpy as np

def read_wav(p):
    try:
        import soundfile as sf; x, sr = sf.read(p, always_2d=True); return x.mean(1), sr
    except ImportError:
        from scipy.io import wavfile; sr, x = wavfile.read(p); x = x.astype(np.float64)
        if x.ndim > 1: x = x.mean(1)
        return x / (np.abs(x).max() + 1e-9), sr

def onsets(x, sr, hop=0.005, min_gap=0.16):
    n = int(sr * hop); env = np.sqrt(np.convolve(x * x, np.ones(n * 4) / (n * 4), "same"))[::n]
    thr = max(env.max() * 0.06, np.percentile(env, 20) * 3)
    on = env > thr; out, quiet = [], int(min_gap / hop); last_off = -quiet
    ends = []
    if on[0]: out.append(0.0)  # speech already running at sample 0 counts as an onset (video 3: 'This is Steve.' flagged wrongly)
    for i in range(1, len(on)):
        if on[i] and not on[i - 1] and i - last_off >= quiet: out.append(i * hop)
        if not on[i] and on[i - 1]: last_off = i; ends.append(i * hop)
    return np.array(out), np.array(ends)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("voice"); ap.add_argument("words"); ap.add_argument("--max", type=float, default=0.08); ap.add_argument("--fix")
    a = ap.parse_args()
    x, sr = read_wav(a.voice); on, ends = onsets(x, sr); W = json.load(open(a.words))
    sents = {}
    for w in W: sents.setdefault(w["s"], []).append(w)
    bad, errs = [], []
    for s, ws in sorted(sents.items()):
        t0 = ws[0]["t"]; near = on[np.argmin(np.abs(on - t0))]; e = t0 - near; errs.append(abs(e))
        if abs(e) > a.max: bad.append((s, round(t0, 2), round(float(near), 2), round(float(e), 2), " ".join(w["w"] for w in ws[:4])))
        if a.fix:
            t1 = ws[-1].get("end", ws[-1]["t"]); later = ends[ends > near + 0.1]
            real_end = float(later[np.argmin(np.abs(later - (t1 - e)))]) if len(later) else t1 - e
            k = (real_end - near) / max(t1 - t0, 1e-3); k = k if 0.7 < k < 1.4 else 1.0
            for w in ws:
                w["t"] = round(float(near + (w["t"] - t0) * k), 3)
                if "end" in w: w["end"] = round(float(near + (w["end"] - t0) * k), 3)
    print(f"sentences {len(sents)}  median error {np.median(errs):.3f} s  worst {max(errs):.3f} s  over limit: {len(bad)}")
    for b in bad: print("  OFF", b)
    if a.fix: json.dump(W, open(a.fix, "w"), indent=0); print("wrote", a.fix)
    sys.exit(1 if bad and not a.fix else 0)

if __name__ == "__main__":
    main()
