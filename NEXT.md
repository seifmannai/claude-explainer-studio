# Where we left off (read this first in a new session)

Last update: 2026-11-09 (morning). New here? Read START-HERE.md first.

## Right now
- Video 2 = THE MICROWAVE, "you invent it" format (videos/microwave). Topic, storyboard, voice (blend40) and look approved by Asma.
  Asma said: start making it, ask only important questions.
- PC tools install (runner `tools` job, 2026-11-09): Kokoro OK; Blender + faster-whisper were already installed.
  Chatterbox + HyperFrames were re-running (job d_tools_1109). Asma will say when it finished; then read logs/d_tools_1109.log ONCE
  and check the lines "CHATTERBOX OK" and the HyperFrames version.
- Next step after that: re-run the microwave stills (fixes written, not yet checked), then sound kit, then one `make` job
  ("tts":"kokoro", voice made on the PC from videos/microwave/script.txt).

## Done
- Video 1: combustion engine Short (videos/combustion-engine), rendered on the PC GPU, posted by the user on 2026-11-09.
  Final file on the PC: out/engine_v1.mp4. QA sheet: videos/combustion-engine/qa_sheet.jpg.
- One-job PC pipeline `make` works (words + audio tested; render/encode use the same tools as v1). See CLAUDE.md "Save credits".
- Skills added: instagram-agent (skills/vendor/instagram-agent), notes from everything-claude-code (skills/notes).

## Microwave video (in progress, 2026-11-09)
- Script + timings done: videos/microwave/script.txt, audio/sentences.json, audio/words.json (voice = Kokoro am_michael*0.4 + am_puck*0.6 via kit/explainer3d/tools/voice_blend.py; voice.wav not committed, rebuild with that tool).
- Scene page: videos/microwave/web/short.html + world.js (kitchen, all props, timeline, sound cues in window.events()).
- First stills looked promising (water buddies, cat, phone) but: too bright, fridge was solid (now hollow), window hidden behind wall (now cut out), pizza close-ups milky (now lid lifts off, top-down camera). These fixes are written but NOT yet checked: re-run stills first (`node kit/explainer3d/tools/stills.mjs . videos/microwave/web/short.html /tmp/mw2 15,80,225,330,735,1520,1700,1830`).
- Still to do: sound kit (SFX for every event + story music), PC render with make (steps render,encode, final.wav staged to the PC).

## Video 2 history (2026-11-09)
3 topic options (videos/_video2-options/TOPICS.md) -> Asma picked the microwave. v1 feedback (too technical) -> styles/FUN-RULES.md.
Asma's choices: high-quality environment, storyboard first, build things in the scene, no inventor character, voice blend40, much better sound.
Also: the engine Short's YouTube title was left as "Upload video" - remind Asma to set titles before publishing.

## Known small fixes for v2 of the engine page
- Hook text "100 EXPLOSIONS EVERY SECOND" overlaps the engine while fading.
- A lone "G." caption chunk after "2,000+ G".
- Whisper with the script as initial_prompt can hallucinate filler; check align output.
