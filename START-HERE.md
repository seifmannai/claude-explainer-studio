# START HERE (for any Claude picking up this work)

This folder is a complete, portable studio for the YouTube channel **"How It Really Works" (@HowItReallyWorks2423)**,
owned by Asma. It works the same on any PC and any Claude account. Read this file, then the files it points to, before doing anything.

## 1. What we are doing
Short vertical videos (1080x1920, ~60-70 s) that explain how everyday tech works, made end to end by Claude:
script -> voice -> 3D/2D animation in code -> sound -> render on Asma's PC GPU -> MP4 she uploads.
Free / open-source tools only. Never paid tools.

## 2. Read in this order (all inside `studio\`)
1. `studio\CLAUDE.md` - the studio rules (workflow, credit-saving rules, what never to do).
2. `studio\NEXT.md` - **where we are right now** and the next step.
3. `studio\styles\FUN-RULES.md` - how our videos must feel (after viewer feedback). Most important style file.
4. `studio\styles\STYLE.md` - look, captions, colours, pacing.
5. `studio\LEARNINGS.md` - lessons, newest first (what broke, what worked, speeds).
6. `studio\VENDOR.md` - what each outside skill is for.
7. `studio\project-notes\` - older notes (toolkit research, the cat cartoon short).

## 3. How Asma likes to work (from our conversations)
- She writes quickly in English (typos are normal). Answer in English, short and clear.
- Ask her only important questions; otherwise make sensible choices and keep going.
- Show progress early (stills, voice samples) so she can steer.
- Videos: fun, animated, casual voice, NOT technical or "professional". One idea + one "wow" at the end.
  Story format "YOU invent it": the narrator talks to the viewer, who builds the machine step by step,
  each new part fixing a funny problem ("...but there's a problem, so you get smarter...").
- Build the world/environment, don't just show the object. Add things to the scene; showing how things are built is fun.
- Sound matters a lot: an effect for every action, room tone, music that follows the story.
- Voice: Kokoro blend **am_michael 0.4 + am_puck 0.6** ("blend40"), natural pacing (per-line speed and pauses).
  Chatterbox (more expressive) is installed on the PC as an option.
- No on-screen inventor character for now (only if a better idea comes up).
- When she says stop or wait, stop immediately and don't keep polling.

## 4. The skills
- Our own skills: `studio\skills\ours\` (tech-explainer-3d, explainer-diagrams, explainer-voice-and-reference, cartoon-audio-short).
- Outside skills (with licences): `studio\skills\vendor\` - viral-hooks, instagram-agent (ig-reel hook scorer, ig-viral), kinetic-typography,
  lemo-opuscar, 3d-toy-character, hand-drawn-cartoon, system-diagram-animation, threejs-*, manim-*, xdis-video-*, and more.
- Claude can simply **read** these SKILL.md files from the folder. To also have our own skills as account skills in a new
  Claude account, upload the zips in `skills-to-upload\` (Claude settings -> Skills -> upload).

## 5. The PC side (this folder)
- `1-SETUP (run once).bat` - first time on a new PC: installs Git, Node, Python, FFmpeg and clones the repo into `studio\`.
- `2-START RUNNER (keep open).bat` - start before Claude works. Claude drops job files in `jobs\`; the runner runs them; logs in `logs\`.
- `3-VIEW PROGRESS.bat` - watch a render.
- Extra tools come from the runner's `tools` job: Blender, faster-whisper, Kokoro (`models\kokoro`, Python env `py\`),
  Chatterbox (Python env `pycb\`), HyperFrames (`hyperframes\`).
- `4-MAKE PORTABLE COPY.bat` - builds a slim copy (`HowItReallyWorks-portable`, usually < 1 GB) next to the folder.
- **Moving to another PC:** copy the portable folder (not the full ~10 GB one), run `1-SETUP`, start the runner,
  connect the folder in the Claude desktop app, then Claude drops a `{"action":"tools"}` job, which rebuilds what was left out:
  Python envs (`py\`, `pycb\`), `hyperframes\`, `models\` (Kokoro). Finished videos (`out\*.mp4`) are kept; render frames are not.
- Claude reaches this folder through the Claude desktop app: connect the folder (Add folder) so Claude can drop jobs and read logs.

## 6. The code repo
`studio\` is a git clone of **github.com/seifmannai/claude-explainer-studio** (it is the studio's memory between sessions).
- If the new Claude account has access to that GitHub repo: attach it, work there, commit + push; the PC runner pulls it.
- If not: work directly on the files in `studio\` (Claude can read/write them through the connected folder), and commit/push
  from the PC (`git -C studio add -A && git -C studio commit -m "..." && git -C studio push`) when GitHub credentials exist on that PC.
- Never commit secrets, voiceover files or full renders.

## 7. Videos so far
- `videos\combustion-engine\` - video 1 (posted). Feedback: too detailed/technical -> led to FUN-RULES.md.
- `videos\microwave\` - video 2, IN PROGRESS: script, storyboard, voice timings, kitchen world + story page done; see NEXT.md.
