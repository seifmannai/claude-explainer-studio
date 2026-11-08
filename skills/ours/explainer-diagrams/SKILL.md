---
name: explainer-diagrams
description: Make animated diagrams for engineering explainers with Manim (waves, signals, circuits, graphs) and system-flow animations, then assemble segments, labels and captions with Remotion or ffmpeg.
---

# Explainer diagrams + assembly

Condensed from skills/vendor/manim*, system-diagram-animation and the Remotion docs. Use 3D (tech-explainer-3d) for physical objects; use this for abstract ideas (modulation, frequency hopping, clock cycles, logic gates, data flow).

## 1. Manim Community Edition
- Install: `pip install --break-system-packages manim` (cairo, pango, ffmpeg; LaTeX only for MathTex; prefer Text/MarkupText).
- `from manim import *` (CE). Never mix with ManimGL (`manimlib`).
- Render: `manim -qh --fps 30 -r 1920,1080 scene.py SceneName` (Shorts `-r 1080,1920`); `--transparent` for overlays.
- One Scene per explanation beat; run_time matched to the voiceover beat lengths.
- Blocks: Axes/NumberPlane + plot for waveforms; ValueTracker + always_redraw for live signals (carrier, AM/FM, QAM); Arrow/Line/DashedLine for flows; VGroup.arrange; LaggedStart; MovingCameraScene for zoom/pan.
- Same channel palette and theme as the 3D shots.

## 2. Motion discipline
- One stage; the diagram grows in story order; nothing appears before it is mentioned.
- Connectors draw on before anything travels along them; packets in the accent colour; failures in the warning colour.
- Something new every 1-2 s; one important thing moves at a time; 0.3-0.75 s stillness before a payoff.
- Entries ease-out <= 0.8 s, exits ~75% of that; no bounce/elastic; no idle wobble on diagrams or text.
- Labels 2-4 words, >= 0.8 s on screen; sentences ~0.3 s per word.

## 3. Assembly
- All segments same resolution and 30 fps, named seg_###.mp4 in story order.
- Simple: ffmpeg concat (re-encode if parameters differ), then lay the final mix on top.
- Remotion (labels, lower thirds, captions, chapter cards): segments in public/, `<Sequence>` + `<OffthreadVideo>`, captions from word timings, `npx remotion render`. Render only when the picture is locked.
- Captions: burned in for Shorts, separate SRT for long videos.

## 4. Checks
Contact sheet of every segment's middle frame; text legible at phone size; nothing overlaps; timing matches the beat list.
