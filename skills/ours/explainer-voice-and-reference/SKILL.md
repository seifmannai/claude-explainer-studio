---
name: explainer-voice-and-reference
description: Narrate explainer videos with the free Kokoro voice, get word timings, mix music and sound at fixed levels, and study reference videos from screenshots or clips to write a channel style guide.
---

# Voice, timing, mix and reference study

## 1. Narration with Kokoro (no account needed)
- `pip install --break-system-packages kokoro-onnx soundfile`
- Model files (GitHub releases, reachable from the cloud workspace):
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx and .../voices-v1.0.bin
- `from kokoro_onnx import Kokoro; k = Kokoro('kokoro-v1.0.onnx', 'voices-v1.0.bin'); audio, sr = k.create(text, voice='am_michael', speed=1.0, lang='en-us')`
- One sentence at a time, joined with 0.25 s pauses (0.5 s at paragraph ends) so sentence timing is exact. One channel voice, never changed (record it in styles/STYLE.md).
- Numbers and units as spoken words; spell acronyms the way they should be said.
- If the user supplies an ElevenLabs file instead, never edit or re-time it.

## 2. Word timings
- sherpa-onnx offline zipformer (`pip install sherpa-onnx soundfile`; model sherpa-onnx-zipformer-en-2023-06-26 from k2-fsa/sherpa-onnx releases `asr-models`). Tokens starting with a space start a word; chunk audio at silences (< 15 s). Save words.json with frames (t * 30). See kit/toon-engine/tools/asr.py.
- Every visual reaction lands 0-3 frames before its word.

## 3. Mix
- Explainer music bed about -14 dB vs voice (gated RMS); SFX <= -10 dB with peaks <= 0.7x voice peak. No ducking/compression on the voice.
- Final: one linear gain to -14 LUFS + -1 dBFS limiter (alimiter level=false), AAC 192k. Measure and print the levels (kit/toon-engine/tools/mix.py, finish.sh).
- Music: synthesized in numpy or licensed for YouTube. Never copyrighted music.

## 4. Studying reference videos
- YouTube is not reachable from the cloud workspace; do not route around it.
- Preferred: the user sends 10-20 screenshots or a short clip -> put them in styles/reference/.
- Clip: `ffmpeg -i clip.mp4 -vf "select='gt(scene,0.3)',scale=480:-1" -vsync vfr shots/%03d.jpg`, contact sheet, view.
- Transcripts only where YouTube is reachable (the user's computer): `pip install yt-dlp`, then `yt-dlp --write-auto-sub --sub-format srt --skip-download URL -o t`.
- If linked to the desktop app, the in-app browser can screenshot paused moments (slow; sparingly).
- Output: update styles/STYLE.md. Describe; never copy specific shots, models or graphics.
