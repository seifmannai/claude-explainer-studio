"""Exact word timings by forced alignment (WhisperX, wav2vec2) of the KNOWN script to the voice.

  python words_wx.py <voice.wav> <script.txt> <words.json> [--fps 24]
  python words_wx.py --selftest

script.txt: one sentence per line, `text|speed|pause` (only the text is used).
Output: [{"w", "t", "end", "f", "s"}] - s = line index. No transcription step, so no wrong or missing words:
the whole script is aligned to the whole file. Always verify with kit/qa/sync_check.py afterwards."""
import json, sys, wave
import numpy as np


def read_wav(path):
    with wave.open(path, 'rb') as w:
        sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes(); raw = w.readframes(n)
    dt = {2: np.int16, 4: np.int32}[sw]
    a = np.frombuffer(raw, dt).astype(np.float32) / float(np.iinfo(dt).max)
    a = a.reshape(-1, ch).mean(axis=1)
    if sr != 16000:
        a = np.interp(np.arange(int(len(a) * 16000 / sr)) / 16000, np.arange(len(a)) / sr, a).astype(np.float32)
    return a


def align(audio, lines):
    import torch, whisperx
    text = ' '.join(lines); dur = len(audio) / 16000
    for dev in (['cuda'] if torch.cuda.is_available() else []) + ['cpu']:
        try:
            model, meta = whisperx.load_align_model(language_code='en', device=dev)
            res = whisperx.align([{'text': text, 'start': 0.0, 'end': dur}], model, meta, audio, dev, return_char_alignments=False)
            print('aligned on', dev, flush=True); return res['word_segments']
        except Exception as e:  # noqa: BLE001 - e.g. GPU out of memory on a long file: retry on the CPU
            print(f'  {dev} failed: {str(e)[:200]}', flush=True)
            if dev == 'cuda': torch.cuda.empty_cache()
    sys.exit('alignment failed')


if __name__ == '__main__':
    if sys.argv[1:] == ['--selftest']:
        import torch, whisperx
        print('WHISPERX OK', getattr(whisperx, '__version__', ''), 'torch', torch.__version__, 'cuda', torch.cuda.is_available())
        whisperx.load_align_model(language_code='en', device='cpu'); print('ALIGN MODEL OK'); sys.exit(0)
    voice, script, out = sys.argv[1:4]
    fps = float(sys.argv[sys.argv.index('--fps') + 1]) if '--fps' in sys.argv else 24
    lines = [l.split('|')[0].strip() for l in open(script, encoding='utf-8') if l.strip() and not l.startswith('#')]
    audio = read_wav(voice); ws = align(audio, lines)
    want = [(w, s) for s, l in enumerate(lines) for w in l.split()]
    if len(ws) != len(want): print(f'WARNING: aligned {len(ws)} words, script has {len(want)}', flush=True)
    words = []
    for i, (w, s) in enumerate(want):
        a = ws[i] if i < len(ws) else {}
        words.append({'w': w, 't': a.get('start'), 'end': a.get('end'), 's': s})
    # words the aligner could not time (digits, symbols): spread between their timed neighbours
    known = [i for i, w in enumerate(words) if w['t'] is not None]
    for i, w in enumerate(words):
        if w['t'] is None:
            p = max([k for k in known if k < i], default=None); n = min([k for k in known if k > i], default=None)
            t0 = words[p]['end'] if p is not None else 0.0; t1 = words[n]['t'] if n is not None else t0 + 0.3
            span = (n if n is not None else i + 1) - (p if p is not None else i - 1)
            w['t'] = t0 + (t1 - t0) * (i - (p if p is not None else i - 1) - 0.5) / span; w['end'] = w['t'] + 0.05
    for w in words: w['t'] = round(float(w['t']), 3); w['end'] = round(float(w['end']), 3); w['f'] = round(w['t'] * fps)
    json.dump(words, open(out, 'w', encoding='utf-8'), indent=0)
    print(f'{len(words)} words -> {out}')
