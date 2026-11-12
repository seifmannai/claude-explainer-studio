# Where we left off (read this first in a new session)

Last update: 2026-11-12, 21:30 Tunis time. New here? Read START-HERE.md first, then CLAUDE.md (the "Quality bar" section is mandatory).

## Right now: video 3 = "Steve & the elevator" (videos/steve-elevator), being rebuilt in a NEW STYLE
v1 (all-3D Steve, rendered overnight, `out\steve_v1\steve_v1.mp4` on the PC) was REJECTED by the user:
music too loud/annoying, glitches (wheel in the roof, white speed lines, hair "crown", halo around Steve),
Steve not alive (static), dialogue not in sync with picture and captions. Full post-mortem: LEARNINGS.md 2026-11-12.

The user's new direction (2026-11-12 evening), approved in principle:
- **The 3D world stays** (our WebGL2 path tracer, `videos/steve-elevator/web/short.html` + `scene.glsl.js`),
  now with **ink outlines** (G-buffer depth creases + normal breaks), soft cel bands and paper grain.
  Switch: `INK` in short.html (query `?ink=0/1`).
- **Characters are DRAWN in 2D** on top of the 3D world: `kit/char2d/stick.js` (our own design, Steve).
  Switch: `DRAWN` (query `?drawn=0/1`). The 3D Steve is hidden when DRAWN=1.
  - Line boil: every line is redrawn differently EVERY frame (`Stick.boilFps = 24`). The user wants
    "every frame a different drawing, never standing still".
  - Real limbs (IK tubes, sleeves, trousers, mitten hands, shoes), 8 expressions (deadpan, smug, panic, defeat,
    idea, angry, suspicious, relief), `Stick.alive()` idle layers, `Stick.act()` 4-part moves with overlap.
  - Placed with the shader's camera maths (`project()` / `drawSteve()` in short.html, 1.78 m tall).
    The pose is still a crude mapping from the old state (TODO: word-driven acting).
- User saw: `steve_drawn_sheet_v2` (expression sheet) and `steve_drawn_alive_test.mp4` (7 s acting test, flat backdrop).
  He has NOT yet seen the ink look in 3D: that needs the PC.
- Reference style the user likes: rough hand-drawn comic faces (thick brows, big expressive eyes and mouths),
  stick-ish people with real limbs. Use as inspiration only; never copy other channels' characters.

## Done 2026-11-12 night (steps 1-4)
- selfupdate OK; install OK: OIDN, WhisperX (+align model) and a PORTABLE Node (<Root>\node; system Node is gone from the PC, runner puts it first on PATH).
- Style stills done: out\stills\style_ink.png / style_noink.png (t=16.5, SNAP moment). Framing and feet OK. Sent to user, waiting for the pick.
  Note: shader compile is now ~178 s per page load (was ~20 s): keep an eye on it for the animatic.
- Word timings: steve_words2 (WhisperX) snapped with sync_check --fix -> videos/steve-elevator/audio/words.json, gate 1 PASSES (53/53, 0.000 s).
- NEXT = step 5 (word-driven v2 timeline) once the user picks ink or no ink.

## Next steps, in order (ask "is your runner on?" before dropping ANY job)
1. Drop `{"action":"selfupdate"}` (runner now accepts `"query"` on still jobs).
2. Drop `{"action":"make","slug":"steve-elevator","name":"tools_1112","steps":"install"}` -> installs
   Open Image Denoise (`<Root>\oidn`) + WhisperX (env `<Root>\pywx`). Check `out\tools_1112\STATUS.txt` and the
   log for "OIDN OK" and "WHISPERX OK" / "ALIGN MODEL OK".
3. Two style stills in the real shaft for the user to choose:
   `{"action":"still","page":"videos/steve-elevator/web/short.html","name":"style_ink","query":"t=16.5&ink=1&drawn=1"}`
   and the same with `ink=0` (name style_noink). Output `out\stills\<name>.png`. Check framing, Steve's size/feet
   on the floor, line quality, then send both to the user. Pick moments where Steve is on screen (see `state(t)`).
4. Word timings: `{"action":"make","slug":"steve-elevator","name":"steve_words2","voice":"in/steve_voice_user_fast.wav","fps":"24","steps":"wxwords"}`
   -> `out\steve_words2\words.json` + `sync_check.txt`. Must pass (0.08 s). Then copy into `videos/steve-elevator/audio/words.json`.
5. Rebuild the v2 timeline WORD-DRIVEN (`at("word")`, never seconds), acting per line with `Stick.act` + `Stick.alive`,
   camera always moving, world always alive (skills/ours/always-alive-3d). Softer music 18-20 dB under the voice, off on gags.
   Fix v1 glitches (see LEARNINGS). Shadows/occlusion for drawn Steve (doors, rope in front of him) still to do.
6. Gate: 540x960 / 2-sample animatic with full sound -> user approves -> alive_check + contact sheet -> full render.

## PC facts
- Folder: `C:\Users\kei\Documents\Youtube channel\HowItReallyWorks\` (start the runner from there, NOT from `-portable`).
- Jobs go in `jobs\` (via device_commit_files), logs in `logs\` (UTF-16), outputs in `out\`. Progress page `out\progress.html`.
- GPU: GTX 1060 mobile. 1080p / 8 spp + denoiser ~6 s per frame. Possible 2nd PC: GTX 1660 Ti desktop.
- Voice: the user's own recording, sped up 1.12x: `in\steve_voice_user_fast.wav` (129.8 s). Reference `in\voice_ref\my_voice_ref.wav`.
- Sound: opus-sound-layer (steps sfxkit, sfxmix), cue sheet `videos/steve-elevator/audio/cues.json`; CC0 sounds in `sfx\`.

## Ideas agreed for later (after this video)
RIFE frame interpolation test, second render PC, runner auto-start + render queue, Audacity for voice cleanup,
YouTube Audio Library music, feedback loop from YouTube Studio retention. Blender only as a workshop (user dislikes its look).

## Older videos
- Video 1: combustion engine (posted). Video 2: microwave (paused; see git history of this file for its state).
- Separate: "the-cat-who-sank-three-ships" cartoon short (videos/the-cat-who-sank-three-ships).
