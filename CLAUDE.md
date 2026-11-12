# Rules for Claude (read first, every session)

This repo is our studio for a YouTube channel of 3D engineering explainer videos (cars, engines, Wi-Fi, Bluetooth, chips...), made end to end by Claude. It is also Claude's memory between sessions.

## Quality bar (user rules, 2026-11-12) - read before anything else
The user's goal: awesome, high-quality 3D videos in mass production. A static picture is the worst failure.
- MANDATORY: open `skills/ours/always-alive-3d/SKILL.md` before building or rendering any 3D scene, and follow it.
  Rule zero: at every frame the character, the world and the camera are all moving. Animation quality comes first.
- Also open, for the task at hand: `skills/vendor/animation-principles/` (the 12 principles, 3D, timing),
  `skills/vendor/shader-skills/` (SDF, noise, particles, post effects), `skills/vendor/opus-sound-layer/` (sound).
- Gates before ANY full render (no exceptions, even if the user is in a hurry: say why):
  1. `python kit/qa/sync_check.py <voice.wav> <words.json>` passes (limit 0.08 s).
  2. A 540x960 / 2-sample animatic of the whole film with full sound, watched and approved by the user.
  3. `python kit/qa/alive_check.py <frames>` passes on the animatic (nothing frozen for more than 4 frames).
  4. Contact sheet of every shot checked for intersections, halos, glitch-like effects and framing.
- Events are tied to WORDS of the voice, never to hard-coded seconds. Reactions land 0-3 frames before the word.
- Music sits 18-20 dB under the voice and drops out on gags. The user's own voice is the channel voice
  (recorded by the user, sped up ~1.12x; reference sample on the PC: `in\voice_ref\my_voice_ref.wav`).
- ALL rendering happens on the user's PC through the runner (started from `HowItReallyWorks\2-START RUNNER`).
  Ask if the runner is on before dropping a render job. Never render in the cloud. Audience: teens and older.
- Build reusable: characters, poses, props, timeline helpers and checks go in `kit/`, never only inside one video.
  Every video must leave the kit better and add its lessons to LEARNINGS.md and to the always-alive-3d skill.

## Start of every session
0. New Claude or new account? Read START-HERE.md first (portable handoff: where we are, how Asma works, PC folder).
1. Read LEARNINGS.md (newest first) and styles/STYLE.md.
2. Pick skills from skills/ours first, then skills/vendor (see VENDOR.md for what each is for). Actually open (Read) every skill you rely on at the start of each video, and list them in videos/<slug>/PLAN.md under "Skills used". Always run viral-hooks for the hook (3 options to the user).
3. Reuse kit/ code. Do not rebuild an engine that already exists here.

## Making a video (default workflow)
1. Topic -> research with sources -> script (fact-checked, numbers as words) -> user approves.
2. Voice (Kokoro unless the user supplies a file) -> word timings -> shot plan (videos/<slug>/PLAN.md).
3. Build scenes -> stills contact sheet -> send to user -> full render in the background (RESUME=1 on restarts).
4. Sound + mix (measured levels) -> finish.sh -> QA sheet -> deliver.
5. Save the video record in videos/<slug>/ (script, PLAN.md, sources, qa_sheet.jpg; no large renders).

## Save credits (efficiency rules)
- PC work = ONE `make` job (kit/local/make.ps1): words -> align -> sound cues -> music/SFX/mix -> render -> encode -> preview + sheet.
  Job: `{"action":"make","slug":"<slug>","name":"<slug>_v1","voice":"in/<file>.wav","scale":"2"}` (optional "steps":"render,encode").
- The PC has (via the `tools` job): Kokoro (models\kokoro, env py), Chatterbox (env pycb, expressive voice), faster-whisper, Blender, HyperFrames (hyperframes\). Use them: the voice is made on the PC by the `make` job's `voice` step from videos/<slug>/script.txt ("tts":"kokoro" default = am_michael*0.4+am_puck*0.6, or "chatterbox"); Blender for photoreal hero shots; HyperFrames for 2D/cartoon scenes. Cloud only writes code and checks stills.
- Then wait with ONE background timer (render ~0.14 s/frame at 2x + ~2 min encode) and read only `out/<name>/STATUS.txt` and `out/<name>/sheet.jpg`.
  QA from `preview.mp4` (small); never stage the full MP4 (the bridge times out above ~100 MB).
- Never list the PC folder recursively (one listing was 200k characters). List the exact folder, stage exact files.
- Runner changes: push to the repo, then drop a `selfupdate` job (no user action needed).
- Cloud preview only for new scenes; reuse kit/ code and the last video's page as the template.
- Write phase results to files in the repo (script, plan, timings) so a new session or a context reset restarts from files, not chat.

## End of every session: improve the studio
- Append dated lessons to LEARNINGS.md: what worked, what broke, render speed, fixes.
- Fix or extend kit/ code and our skills when a lesson applies generally.
- New outside skill or repo worth using: review it for unsafe commands first, add it to skills/vendor/ with its LICENSE, and list it in VENDOR.md. Outside code with no licence: write the lessons in our own words, link the source, do not copy it.
- Commit with a clear message and push.

## Never
- Never use or propose paid tools, services or subscriptions. Free or open-source only (free tiers of the platforms themselves are fine).
- Never commit secrets, API keys, personal data, voiceover files or full renders.
- Never copy another channel's shots, models, graphics or music.
