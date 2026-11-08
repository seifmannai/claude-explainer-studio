# Learnings (newest first)

## 2026-11-08 - Channel rebrand
- User rule: free or open-source tools only. Research: YouTube Studio Analytics + Research tab, Google Trends, TikTok Creative Center. Scheduling: YouTube Studio, TikTok web scheduler, Meta Business Suite (IG + FB). Uploads/metadata: the desktop app browser, with user approval before Publish.
- Channel renamed to How It Really Works; logo and banner in brand/ (SVG source in brand.html, rendered with Playwright). Banner text must stay inside the 1546x423 centre safe area (checked by pixel scan).
- Shorts rule from the user: 61-70 s (target 65 s) so TikTok monetises; one vertical cut for YouTube Shorts, Reels, Facebook, TikTok. Hook in the first 1-3 s, re-hook every 15-20 s.
- YouTube pages render blank in a hidden desktop-browser pane; read channel data from ytInitialData via fetch instead.

## 2026-11-08 - Studio set up
- Researched ~250 video skills/repos. Best fits for engineering explainers: make-blender-education-video (Blender, needs a GPU), lemo-opuscar (teardown / circuit-board / glass-product styles), paper2video (fact checker), explainroo (Kokoro + Whisper + canvas).
- Kokoro voice model downloads fine from GitHub releases in the cloud workspace. Whisper/HuggingFace hosts are blocked; use sherpa-onnx models from GitHub releases for word timings.
- YouTube is blocked from the cloud workspace: style references must come as user screenshots/clips, or via the desktop app's browser when linked.
- Repo creation is not possible from the cloud shell; use the linked desktop browser (github.com/new) or ask the user.

## 2026-11-06 - The Cat Who Sank Three Ships (videos/the-cat-who-sank-three-ships)
- Most of the token cost was writing the engine from scratch (the skill's bundled kit was missing). Now it lives in kit/toon-engine: reuse it.
- ElevenLabs "Grandpa" read at ~2.15 words/s: a 108-word script ran 50 s, not 29 s. Estimate script length from the chosen voice's real speed.
- sherpa-onnx zipformer gave exact word timestamps (transcript matched the script 100%).
- Render speed: CPU SwiftShader 1080x1920 ~2-4 s/frame (1509 frames ~ 85 min). Container restarted mid-render; tmp+rename writes + RESUME=1 lost nothing.
- Look traps fixed: card halo (ND alpha test must equal colour alpha test, 0.04); subject out of the narrow vertical frame (check horizontal half-width); golden/dusk back-light turned ships into brown silhouettes (put the sun on the camera side, tint the sea blue to compensate); canvas sign text overflowed (measure and shrink); camera crane passed through the carrier island (route via a waypoint).
- Audio: a sustained drone normalised with the march came out 9 dB louder than the music; check per-section RMS after synthesis. Final limiter 0.85 linear gives ~-1 dBTP after AAC.
