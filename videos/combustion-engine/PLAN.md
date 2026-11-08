# PLAN: How Your Car Engine Really Works (Short)

- Format: 1080x1920, 30 fps, ~63.6 s (voice 62.5 s + tail). Rendered on the PC GPU at scale 2 (4K inside), saved 1080x1920.
- Look: realistic metal cutaway (HDRI studio_small_09, GTAO, bloom on emissives only, light DOF, grain), channel palette.
- Voice: Kokoro af_heart, speed 0.94 (channel voice). Hook 1 (specificity): "One hundred explosions every second."
- Page: videos/combustion-engine/web/short.html (story) on kit/explainer3d (core.js, particles.js, ui.js).

## Skills used
- skills/ours/tech-explainer-3d (render contract, cutaway, camera grammar, look check)
- skills/ours/explainer-voice-and-reference (Kokoro narration, word timings, mix levels)
- skills/ours/explainer-diagrams (motion discipline: one thing at a time, labels 2-4 words, ease-out entries)
- skills/vendor/viral-hooks (3 hook options; chose Cat 09 specificity)
- skills/vendor/threejs-shaders (ShaderMaterial pitfalls: linear colours inside the composer, no `position` uniform)
- skills/vendor/threejs-lighting, threejs-materials, threejs-postprocessing (studio env, physical metals, post chain; from the style-frame work)

## Beats (times come from audio/sentences.json; words from audio/words.json)
| # | Narration | Picture |
|---|-----------|---------|
| 0 | One hundred explosions every second. | Close on the chamber, engine spinning fast with a flash every power stroke. "100 / EXPLOSIONS / EVERY SECOND" pops word by word; footnote "a 4-cylinder engine at 3,000 rpm". |
| 1 | That's your car engine. | Pull back to the whole cutaway; brand appears; captions start. |
| 2 | Inside each cylinder, a metal piston slides up and down. | Slow orbit, engine slowing; labels Cylinder, Piston. |
| 3-4 | Step one, intake... sucks in air and fuel. | Pills: INTAKE. Lands on TDC; piston down; intake valve opens; blue fuel-air mist flows through the cut-open intake runner and swirls into the chamber. Labels Intake valve, Air + fuel. |
| 5-6 | Step two, compression... a tenth of the space. | COMPRESSION. Valves shut, piston up, mist squeezes and warms (blue to amber). Callout "≈ 10 : 1". |
| 7-8 | Step three, power. The spark plug fires. | POWER. Close on the plug: spark burst (GPU sparks), flash. Label Spark plug. |
| 9 | The mixture burns at two thousand degrees, and the pressure slams the piston down. | Flame front spreads from the plug through the chamber; callout "2,000 °C / hotter than lava"; on "slams" the piston drops fast, camera shake, flame expands and dims. |
| 10-11 | Step four, exhaust... pushes the burnt gas out. | EXHAUST. Exhaust valve opens, grey burnt gas leaves through the exhaust runner and drifts away. Label Exhaust valve. |
| 12 | Then it all repeats. | Engine spins up, pills cycle with the strokes, flash every power stroke. |
| 13 | Connecting rod and crankshaft... like your legs on bike pedals. | Camera down to the crank; labels Connecting rod, Crankshaft; flywheel marks show rotation; leg-and-pedal pictogram synced to the crank. |
| 14 | At six thousand RPM... stops and reverses twice each turn, pulling over two thousand G. | Fast spin from the other side; "6,000 RPM" counter; on "stops" the engine slows, a piston-height graph with STOP markers; on "pulling" back to full speed with "2,000+ G". |
| 15-17 | And here's the catch... a third... the rest turns into heat. | Wide; split bar "≈1/3 MOVES THE CAR / ≈2/3 HEAT"; engine metal glows orange; heat haze rises (GPU particles). |
| 18-19 | That's why your engine needs a radiator. Follow... | "NEXT: THE RADIATOR"; "FOLLOW for part 2" pill. |

## Platform safety (no flags, no demonetisation)
- Original 3D, original synthesized music and sounds, our own script and facts with sources (SCRIPT.md).
- Hook claim footnoted on screen (4-cylinder at 3,000 rpm); no misleading thumbnails; no copyrighted audio.
- Synthetic voice: AI narration of an animated explainer, not a real person; nothing realistic is faked.
