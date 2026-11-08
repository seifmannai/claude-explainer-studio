# Toon engine (from "The Cat Who Sank Three Ships")

Frame-by-frame Three.js renderer: toon materials, ink outlines (normal/depth pass), depth of field, grade, flashes; canvas-drawn cards (cast.js, toonbase.js); animated sea (waves.js); ships and sets (world.js); timeline (story.js).

Setup: `cd web && npm i three@0.160.0`; link Playwright (`node_modules/playwright -> global`).
Tools (run from the project root with web/ beside them):
- `node tools/render.mjs frames "0-1508"` (RESUME=1 to continue), `python3 tools/sheet.py stills/a sheet.jpg 8`
- `python3 tools/asr.py voice16.wav` word timings (sherpa-onnx), `python3 tools/audio.py` stems, `python3 tools/mix.py voice.mp3 music.wav sfx.wav`, `bash tools/finish.sh "Title"`
Paths inside the tools assume the project layout of videos/the-cat-who-sank-three-ships; adapt per video.
