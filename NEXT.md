# Where we left off (read this first in a new session)

## 2026-11-20: video 5 "noise-cancelling" (videos/noise-cancelling) - first cut in VideoHub (guide Kokoro voice)
- Jobs t1120a (Chatterbox clone of the user's voice) + t1120b (WhisperX words) wait in jobs\: the runner was off.
  When out\anc_voice_v1 + out\anc_words_v1 exist: tools/words_to_film.py (in videos/touchscreen/tools) -> words.json,
  re-run tools/mix.py, copy film/ to Documents\VideoHub\films\noise-cancelling.
- Wait for the user's VideoHub notes.


## 2026-11-16 23:50: video 4 "Dave builds a touchscreen" (videos/touchscreen) - IN VIDEOHUB LIVE PREVIEW
- Script approved by the user in chat (videos/touchscreen/script.txt, PLAN.md). Character: Dave (cap, orange shirt).
- Film code: videos/touchscreen/film (copied to Documents\VideoHub\films\touchscreen on the PC). Guide Kokoro voice.
- Waiting for the user's VideoHub notes ("VideoHub: N notes on ..."): fix in film/*.js, copy changed files to the PC.
- Then: the user's own voice (or Kokoro on the PC) -> WhisperX words -> regenerate words.json/words-data.js -> mix.py.
- Render only when the user asks (VideoHub queue, render.js is 1080x1920, 30 fps, 2 s chunks).


## 2026-11-15 18:15: steve-elevator FINAL DONE
- Final: `out\steve_final_v2\steve_final_v2.mp4` on the PC (1080x1920, 131 s, hook patched). Preview sent to the user;
  waiting for his verdict / upload. Known small issues: lamp glow in the claws close-up, Steve small in some wides,
  exterior tower wides have a still background (see LEARNINGS 2026-11-15).

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

## Done 2026-11-14 (style v2.1 on the PC)
- Ink lines ~2x thicker/darker, no ink on or around light sources, drawn Steve tinted by the scene (ambient + lamp key +
  cool shade) and occluded by nearer geometry (2nd post pass with uMask/uCharZ). Stills: out\stills\style3_snap.png,
  style3_hero.png (t=66, close shot in the car). Sent to the user as style3_two_shots.jpg; waiting for his verdict.
- Good still moments: t=16.5 (snap, medium), t=66 (hero close). t=6 is a wide where Steve is cut off: avoid.
- A still costs ~6 min on the GTX 1060 (185 s shader compile + ~180 s render at 2x).

## Done 2026-11-14 (evening): history flashback
- User saw steve_1854_flashback_test.mp4 (Otis 1854, drawn + old film + rewind/fast-forward, his voice) and LOVED it:
  "that's great". New permanent rule in CLAUDE.md + always-alive-3d 4b: every sentence/side story is shown, never a
  still image. Scene code: videos/steve-elevator/web/flashback.js (not yet wired into short.html: in the flashback window
  short.html must skip the path tracer and call makeFlashback(Words(WORDS)).draw(g, t, W, H, presentCanvas)).

## User decisions 2026-11-14 19:20 (before the v2 rebuild)
- Music: Claude generates a NEW, much softer track (slow, quiet, no drums/plucks), 18-20 dB under the voice, silent on gags.
- Ink lines on the 3D world: KEEP.
- Gags that don't read visually may be redesigned (voice/script unchanged); user approves them in the animatic.
- User rule: detailed sets, no glitches, no inconsistencies -> always-alive-3d 6b + CONTINUITY.md per video.
- Time estimate given: rebuild (code) first; animatic 540x960 / 2 spp ~30-40 min on the PC; full 1080p / 8 spp
  ~4-5 h overnight on the GTX 1060 (3D parts ~5-6 s/frame, the 11 s flashback is 2D and fast).

## Animatic v2 done 2026-11-14 22:02 (out\steve_anim_v2\preview.mp4, sent to the user; waiting for his notes)
- 540x960 / 2 spp: 1.86 s/frame (98 min for 3,163 frames; my 30-40 min estimate was wrong). alive_check PASSES (0 % still).
- Fixed after review: drawn Steve's giant head peeking in at the bottom of the claw close-ups (skip when >45 % below frame).
- To look at: big white lamp glow in the "spring-loaded claws" close-up; Steve tiny in some wides.
- Speed-up for the final pushed (box-sized lighting layers, tint every 6 frames). Final 1080p/8 spp estimate ~5 h.

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
