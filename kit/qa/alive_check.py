"""Nothing-is-static check (skills/ours/always-alive-3d, gate 3).

  python alive_check.py <frames_dir> [--fps 24] [--max-still 4] [--report out.json]

Reads f0000.jpg... in order, compares consecutive frames (downscaled, luma) and fails when:
  * any run of more than --max-still frames is near-identical (whole picture frozen), or
  * inside a shot, the centre region (character) or the outer region (world) stays frozen for > 1 s.
Captions are masked out (bottom band) so moving text cannot hide a dead picture. Exit code 1 on failure."""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image

def load(p, w=90, h=160):
    return np.asarray(Image.open(p).convert("L").resize((w, h), Image.BILINEAR), dtype=np.float32)

def runs(mask):
    out, start = [], None
    for i, m in enumerate(mask):
        if m and start is None: start = i
        if not m and start is not None: out.append((start, i - 1)); start = None
    if start is not None: out.append((start, len(mask) - 1))
    return out

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("frames"); ap.add_argument("--fps", type=float, default=24)
    ap.add_argument("--max-still", type=int, default=4); ap.add_argument("--report"); ap.add_argument("--thr", type=float, default=0.35)
    a = ap.parse_args()
    files = sorted(glob.glob(os.path.join(a.frames, "f*.jpg")))
    if len(files) < 2: sys.exit("no frames")
    prev = load(files[0]); H, W = prev.shape
    cap0 = int(H * 0.80)                                     # caption band (masked)
    cy0, cy1, cx0, cx1 = int(H * .2), int(H * .78), int(W * .25), int(W * .75)
    whole, centre, outer, cut = [], [], [], []
    for f in files[1:]:
        cur = load(f); d = np.abs(cur - prev); d[cap0:] = 0
        c = d[cy0:cy1, cx0:cx1].mean(); m = d[:cap0].mean()
        o = (d[:cap0].sum() - d[cy0:cy1, cx0:cx1].sum()) / (cap0 * W - (cy1 - cy0) * (cx1 - cx0))
        whole.append(m); centre.append(c); outer.append(o); cut.append(m > 18); prev = cur
    whole, centre, outer = map(np.array, (whole, centre, outer))
    t = lambda i: round((i + 1) / a.fps, 2)
    problems = []
    for s, e in runs(whole < a.thr):
        if e - s + 1 > a.max_still: problems.append(dict(kind="frozen picture", start_s=t(s), end_s=t(e), frames=e - s + 1))
    sec = int(a.fps)
    for name, arr in (("frozen character area", centre), ("frozen world/background", outer)):
        for s, e in runs(arr < a.thr * 0.8):
            if e - s + 1 > sec: problems.append(dict(kind=name, start_s=t(s), end_s=t(e), frames=e - s + 1))
    rep = dict(frames=len(files), fps=a.fps, cuts=int(sum(cut)), mean_motion=float(whole.mean()),
               still_fraction=float((whole < a.thr).mean()), problems=problems, ok=not problems)
    if a.report: json.dump(rep, open(a.report, "w"), indent=1)
    print(json.dumps({k: v for k, v in rep.items() if k != "problems"}))
    for p in problems[:40]: print("  FAIL", p)
    sys.exit(0 if rep["ok"] else 1)

if __name__ == "__main__":
    main()
