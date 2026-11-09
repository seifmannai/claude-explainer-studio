# Rules for Claude (read first, every session)

This repo is our studio for a YouTube channel of 3D engineering explainer videos (cars, engines, Wi-Fi, Bluetooth, chips...), made end to end by Claude. It is also Claude's memory between sessions.

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
