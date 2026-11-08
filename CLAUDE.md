# Rules for Claude (read first, every session)

This repo is our studio for a YouTube channel of 3D engineering explainer videos (cars, engines, Wi-Fi, Bluetooth, chips...), made end to end by Claude. It is also Claude's memory between sessions.

## Start of every session
1. Read LEARNINGS.md (newest first) and styles/STYLE.md.
2. Pick skills from skills/ours first, then skills/vendor (see VENDOR.md for what each is for).
3. Reuse kit/ code. Do not rebuild an engine that already exists here.

## Making a video (default workflow)
1. Topic -> research with sources -> script (fact-checked, numbers as words) -> user approves.
2. Voice (Kokoro unless the user supplies a file) -> word timings -> shot plan (videos/<slug>/PLAN.md).
3. Build scenes -> stills contact sheet -> send to user -> full render in the background (RESUME=1 on restarts).
4. Sound + mix (measured levels) -> finish.sh -> QA sheet -> deliver.
5. Save the video record in videos/<slug>/ (script, PLAN.md, sources, qa_sheet.jpg; no large renders).

## End of every session: improve the studio
- Append dated lessons to LEARNINGS.md: what worked, what broke, render speed, fixes.
- Fix or extend kit/ code and our skills when a lesson applies generally.
- New outside skill or repo worth using: review it for unsafe commands first, add it to skills/vendor/ with its LICENSE, and list it in VENDOR.md. Outside code with no licence: write the lessons in our own words, link the source, do not copy it.
- Commit with a clear message and push.

## Never
- Never commit secrets, API keys, personal data, voiceover files or full renders.
- Never copy another channel's shots, models, graphics or music.
