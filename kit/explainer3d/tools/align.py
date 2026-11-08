# Caption words with times: script tokens (exact spelling) + times from ASR when available.
#   python align.py sentences.json words.json [asr.json] [--display display.json]
# sentences.json: from voice.py (exact sentence start/end). asr.json: from kit/local/words.py ([{w, t, end}]).
# Without ASR, times inside a sentence are spread by syllable-ish length (good enough for captions).
# display.json: {"one hundred": "100", "r p m": "RPM"} -> merges spoken tokens into one caption token.
import json, re, sys
from difflib import SequenceMatcher

argv = sys.argv[1:]
disp = {}
if '--display' in argv:
    j = argv.index('--display'); disp = json.load(open(argv[j + 1])); del argv[j:j + 2]
args = argv
sents = json.load(open(args[0])); out = args[1]
asr = json.load(open(args[2])) if len(args) > 2 else None
norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
weight = lambda w: max(1, len(re.findall(r'[aeiouy]+', w.lower()))) + 0.3   # rough syllables

words = []
for s in sents:
    toks = s['text'].split()
    # default: spread over the sentence by syllables
    tot = sum(weight(w) for w in toks); t = s['t0']; span = s['t1'] - s['t0']; tw = []
    for w in toks:
        d = span * weight(w) / tot; tw.append({'w': w, 't': round(t, 3), 'end': round(t + d, 3)}); t += d
    if asr:
        seg = [a for a in asr if s['t0'] - 0.3 <= a['t'] <= s['t1'] + 0.1]
        sm = SequenceMatcher(None, [norm(w['w']) for w in tw], [norm(a['w']) for a in seg], autojunk=False)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                tw[blk.a + k]['t'] = seg[blk.b + k]['t']; tw[blk.a + k]['end'] = seg[blk.b + k]['end']
        for i in range(1, len(tw)):   # keep monotonic
            if tw[i]['t'] < tw[i - 1]['t']: tw[i]['t'] = tw[i - 1]['t']
    # display merges (longest first)
    i = 0
    while i < len(tw):
        hit = None
        for k, v in sorted(disp.items(), key=lambda kv: -len(kv[0].split())):
            n = len(k.split())
            if [norm(w['w']) for w in tw[i:i + n]] == [norm(x) for x in k.split()]:
                hit = (n, v); break
        if hit:
            n, v = hit; tail = re.sub(r'^.*?([.,!?:;]*)$', r'\1', tw[i + n - 1]['w'])
            words.append({'w': v + tail, 't': tw[i]['t'], 'end': tw[i + n - 1]['end'], 's': s['i']}); i += n
        else:
            words.append({**tw[i], 's': s['i']}); i += 1
for w in words: w['f'] = round(w['t'] * 30)
json.dump(words, open(out, 'w'), indent=0)
print(len(words), 'caption words ->', out, '(ASR)' if asr else '(estimated)')
