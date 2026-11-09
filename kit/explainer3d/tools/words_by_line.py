# Word timings per narration line (exact line windows from sentences.json, sherpa-onnx inside each).
#   python words_by_line.py audio_dir   -> audio_dir/words.json [{w, t, f, line}]
import json, sys, numpy as np, soundfile as sf, sherpa_onnx
d = '/home/claude/asr/sherpa-onnx-zipformer-en-2023-06-26/'
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=d+'encoder-epoch-99-avg-1.int8.onnx', decoder=d+'decoder-epoch-99-avg-1.onnx',
      joiner=d+'joiner-epoch-99-avg-1.int8.onnx', tokens=d+'tokens.txt', num_threads=2, decoding_method='greedy_search')
ad = sys.argv[1]
a, sr = sf.read(ad + '/voice_raw.wav', dtype='float32')
sents = json.load(open(ad + '/sentences.json'))
words = []
for s in sents:
    t0 = max(0, s['t0'] - 0.05)
    st = rec.create_stream(); st.accept_waveform(sr, a[int(t0*sr):int((s['t1']+0.1)*sr)]); rec.decode_stream(st)
    cur = None
    for tok, t in zip(st.result.tokens, st.result.timestamps):
        if tok.startswith(' ') or cur is None:
            if cur: words.append(cur)
            cur = {'w': tok.strip(), 't': round(t0 + t, 3), 'line': s['i']}
        else: cur['w'] += tok
    if cur: words.append(cur)
for w in words: w['f'] = round(w['t'] * 30)
json.dump(words, open(ad + '/words.json', 'w'), indent=0)
print(len(words), 'words;', ' '.join(w['w'] for w in words)[:400])
