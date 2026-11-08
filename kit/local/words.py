# Word timings with faster-whisper (MIT) on the PC's GPU, CPU as fallback.
#   python words.py <voice.wav> <words.json> [script.txt]
#   python words.py --selftest
# Output: [{"w": word, "t": start_s, "end": end_s, "f": start_frame_at_30fps}, ...]  (same "w"/"t" keys as kit/toon-engine/tools/asr.py)
import glob, json, os, site, sys

# pip's NVIDIA wheels (cuBLAS, cuDNN) put their DLLs here on Windows; make them visible.
for sp in site.getsitepackages() + [site.getusersitepackages()]:
    for d in glob.glob(os.path.join(sp, 'nvidia', '*', 'bin')):
        os.environ['PATH'] = d + os.pathsep + os.environ['PATH']
        if hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(d)

from faster_whisper import WhisperModel, download_model

MODEL = os.environ.get('WHISPER_MODEL', 'large-v3')


def load():
    try:
        path = download_model(MODEL)  # cached after the first time (Hugging Face, ~3 GB for large-v3)
    except Exception as e:  # noqa: BLE001
        sys.exit(f'model download failed: {e}')
    # GTX 10xx (Pascal) has slow float16, so int8 first on the GPU.
    for dev, ct in (('cuda', 'int8'), ('cuda', 'float32'), ('cpu', 'int8')):
        try:
            m = WhisperModel(path, device=dev, compute_type=ct)
            print(f'whisper model {MODEL} on {dev} ({ct})', flush=True)
            return m
        except Exception as e:  # noqa: BLE001 - try the next option
            print(f'  {dev}/{ct} not available: {str(e)[:160]}', flush=True)
    sys.exit('no usable device')


def read_wav(path):
    import wave
    import numpy as np
    with wave.open(path, 'rb') as w:
        sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(n)
    dt = {2: np.int16, 4: np.int32}[sw]
    a = np.frombuffer(raw, dt).astype(np.float32) / float(np.iinfo(dt).max)
    a = a.reshape(-1, ch).mean(axis=1)
    if sr != 16000:
        t_new = np.arange(int(len(a) * 16000 / sr)) / 16000
        a = np.interp(t_new, np.arange(len(a)) / sr, a).astype(np.float32)
    return a


if __name__ == '__main__':
    if sys.argv[1:] == ['--selftest']:
        import numpy as np
        m = load()
        sr = 16000
        t = np.arange(sr * 2) / sr
        list(m.transcribe((0.01 * np.sin(2 * np.pi * 220 * t)).astype('float32'), word_timestamps=True)[0])
        print('SELFTEST OK')
        sys.exit(0)
    audio, out = sys.argv[1], sys.argv[2]
    prompt = open(sys.argv[3], encoding='utf-8').read()[:800] if len(sys.argv) > 3 else None
    m = load()
    audio = read_wav(audio)  # numpy in, so faster-whisper never calls PyAV (version clash on Windows)
    segs, info = m.transcribe(audio, language='en', word_timestamps=True, initial_prompt=prompt, beam_size=5)
    words = []
    for s in segs:
        print(f'{s.start:6.2f} {s.text}', flush=True)
        for w in s.words:
            words.append({'w': w.word.strip(), 't': round(w.start, 3), 'end': round(w.end, 3), 'f': round(w.start * 30)})
    json.dump(words, open(out, 'w', encoding='utf-8'), indent=0)
    print(f'{len(words)} words -> {out}')
