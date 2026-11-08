# Where we left off (read this first in a new session)

Last update: 2026-11-09

## Done
- Video 1: combustion engine Short (videos/combustion-engine), rendered on the PC GPU, posted by the user on 2026-11-09.
  Final file on the PC: out/engine_v1.mp4. QA sheet: videos/combustion-engine/qa_sheet.jpg.
- One-job PC pipeline `make` works (words + audio tested; render/encode use the same tools as v1). See CLAUDE.md "Save credits".
- Skills added: instagram-agent (skills/vendor/instagram-agent), notes from everything-claude-code (skills/notes).

## Next task
Plan video 2 using every helpful skill (viral-hooks, ig-reel hook scorer, ig-viral for what works in the niche,
tech-explainer-3d, explainer-diagrams, lemo-opuscar styles, kinetic-typography...) to maximise reach:
strong hook, re-hooks, many varied visuals (not one object for 60 s), context-first storytelling (styles/STYLE.md).
Deliver: 3 topic options with hooks -> user picks -> script -> voice -> page -> one `make` job.
STATUS 2026-11-09: user feedback: v1 too technical. Read styles/FUN-RULES.md first. Discussing style/character/voice before choosing topic; nothing built yet.

## Known small fixes for v2 of the engine page
- Hook text "100 EXPLOSIONS EVERY SECOND" overlaps the engine while fading.
- A lone "G." caption chunk after "2,000+ G".
- Whisper with the script as initial_prompt can hallucinate filler; check align output.
