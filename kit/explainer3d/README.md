# kit/explainer3d - reusable 3D explainer Shorts/videos

Pipeline for one video (see videos/combustion-engine as the reference):
1. Script -> `lines.txt` (one sentence per line, blank line = paragraph pause, `[pause 0.4]` = extra silence).
2. `python tools/voice.py lines.txt audio af_heart 0.94` -> audio/voice.wav + sentences.json (exact sentence times).
3. Word times: PC job `words` (faster-whisper on the GPU) -> out/words/<name>.json, then
   `python tools/align.py audio/sentences.json audio/words.json <asr.json> --display audio/display.json`
   (without ASR it estimates; display.json turns spoken numbers into "2,000", "RPM"...).
4. Page `videos/<slug>/web/short.html`: `createStudio()` (renderer, HDRI, post), `makeMaterials()` + `part()` (metal, hatched cutaway),
   `gpuParticles()` (motion written in GLSL, deterministic), `createUI()` (labels, pills, callouts, captions, bars),
   `keys()` for camera paths. Time everything from sentences/words. Expose `window.renderFrame(f)`, `window.events()`, `window.done`.
5. Preview in the cloud: `node tools/stills.mjs . <page> <out> 0,300,600` (SwiftShader ~10 s/frame) -> contact sheet.
   Sound cues: `node tools/stills.mjs . <page> audio events`.
6. Audio: `python tools/audio_kit.py events.json sentences.json audio --sections sections.json` then
   `python tools/mix.py voice.wav music.wav sfx.wav audio` -> final.wav (-14 LUFS).
7. PC: job `render` with `"scale":"2"` (4K inside, saved 1080x1920), then `encode` with the final audio.

GLSL rule: smoothstep(edge0, edge1, x) needs edge0 < edge1 (reversed is undefined: works on NVIDIA, breaks elsewhere).
Particles: keep additive particles sparse (alpha ~0.2) or they stack into white static; never pack big grey normal-blend particles in a small volume.
