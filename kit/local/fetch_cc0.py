"""Download CC0 audio candidates (music beds, ambiences, long foley) from Openverse, no API key.
Used by make.ps1 step 'sfxkit' for sounds the opus-sound-layer library can't judge (music, loops, hums).

  python fetch_cc0.py <list.txt> <outdir>
list.txt: one "name|query|n" per line ('#' comments). Writes <outdir>/<name>/<n>.<ext> and <outdir>/index.json
(name, file, title, creator, licence, source url, duration) so the credits can be written later."""
import json, os, sys, urllib.parse, urllib.request

UA = "HowItReallyWorks-studio/1.0 (CC0 audio fetch)"

def get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()

def main(lst, out):
    os.makedirs(out, exist_ok=True); index = []
    for line in open(lst, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        name, query, n = (line.split("|") + ["4"])[:3]
        q = urllib.parse.urlencode(dict(q=query, license="cc0", page_size=int(n) * 2))
        try: res = json.loads(get("https://api.openverse.org/v1/audio/?" + q)).get("results", [])
        except Exception as e: print("search failed", name, e); continue
        d = os.path.join(out, name); os.makedirs(d, exist_ok=True); got = 0
        for r in res:
            if got >= int(n): break
            url = r.get("url") or ""
            ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower() or ".mp3"
            if ext not in (".mp3", ".wav", ".ogg", ".flac"): continue
            f = os.path.join(d, f"{got + 1}{ext}")
            try: open(f, "wb").write(get(url, 120))
            except Exception as e: print("download failed", url, e); continue
            got += 1
            index.append(dict(name=name, file=f, title=r.get("title"), creator=r.get("creator"), licence="CC0",
                              source=r.get("foreign_landing_url") or url, duration_ms=r.get("duration")))
            print(name, got, r.get("title"), r.get("duration"))
    json.dump(index, open(os.path.join(out, "index.json"), "w"), indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
