# Learnings (newest first)

## 2026-11-08 - Local GPU setup (user's PC)
- User PC: Windows 11, i7-7700HQ, 16 GB RAM (often ~87% used), GTX 1060 laptop GPU, NVMe SSD C:. Work folder: C:\Users\kei\Documents\Youtube channel\HowItReallyWorks.
- No device shell in this session: files are written with device_commit_files; kit/local/runner.ps1 executes an allowlist of job files (pull, npm, three, speedtest, render, encode). setup.ps1 installs Git/Node/Python/FFmpeg via winget, clones the repo, forces Edge onto the NVIDIA GPU and runs a speed test.
- Rendering on the PC uses Microsoft Edge through playwright-core (no Chromium download), headed window, ANGLE d3d11.
- Speed test 2026-11-08: GTX 1060 via ANGLE D3D11 = 0.051 s/frame (render + JPEG save) for the engine scene vs ~3.4 s/frame on the cloud CPU (about 60x faster). A 65 s Short (1950 frames) renders in ~2 min. setup.log is UTF-16: decode before reading.
- canvas.toDataURL captures only the WebGL canvas; HTML overlays (hook, labels, captions) must be drawn into a canvas or captured with page screenshots when rendering videos.

## 2026-11-08 - Combustion engine style frame
- Applied threejs-lighting/materials/postprocessing: three r170 (scene.environmentIntensity, GTAOPass), MeshPhysicalMaterial with real metalness + noise roughness/bump maps, MSAA composer target, three-point light + cyan rim. Poly Haven HDRIs are blocked from the cloud workspace, so the environment is a procedural "photo studio" scene (softbox planes) via PMREM.fromScene.
- Lesson: full metalness reflects the environment; a dark studio makes steel black. Use a mid-grey studio background (#2b3646) with large softboxes incl. one behind the camera, environmentIntensity ~1.35. Flat bright end caps blow out under bloom: raise bloom threshold above 1 so only emissive parts glow.
- First style frame made from memory of tech-explainer-3d only; viral-hooks, threejs-* and the Blender four-stroke demo were not opened. Rule added: read the skills you rely on and list them in PLAN.md.
- Vertical framing: hook text needs the top ~25%, captions the bottom ~20%; keep the subject between y=520 and y=1560 px. Camera at ~28 m with fov 30 fits a 7.6 m-tall cutaway.
- Metal looked too dark with metalness 0.85 and RoomEnvironment only; metalness ~0.45 + stronger hemisphere fill reads better on CPU renders.

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
