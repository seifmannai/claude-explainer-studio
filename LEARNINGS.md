# Learnings (newest first)


## 2026-11-12 (evening) - new style direction: 3D world + drawn characters
- The SDF 3D Steve hit a ceiling (mannequin face, expensive). New kit style: the world stays path-traced 3D with
  ink outlines (G-buffer depth creases + normal breaks, soft cel bands, paper grain) and characters are drawn in
  2D on top (`kit/char2d/stick.js`), placed with the same camera projection as the shader (feet + 1.78 m height).
- Line boil: every path goes through a sketch layer that redraws it differently on EVERY frame (Stick.boilFps = 24;
  12 = classic "on twos"). On twos, alive_check counted 33 % of frames as identical; on ones it is 0 %.
- Limbs: two-bone IK, tapered tubes (sleeves, trousers), mitten hands, shoes; elbows/knees pick the outward-and-down side.
  Arms longer than the shoulder-hand distance make spaghetti loops: keep arm length ~1.3x the rest distance.
- The ink lines in 3D boil too (sample point wobbles per frame), so world and character feel drawn by the same hand.
- Chromatic fringing removed from the post pass (it read as a glitch).
- PC tools: `make` step `install` = Open Image Denoise + WhisperX (own env pywx, torch 2.6 cu124 for the GTX 1060);
  step `wxwords` = force-align the known script to the voice, then sync_check writes out/<name>/sync_check.txt.
- Runner `still` job takes an optional "query" (e.g. "t=16.5&ink=1&drawn=1") for A/B style stills.

## 2026-11-12 - video 3 v1 rejected by the user ("so bad"): what went wrong and the rules that came out of it
- Rendered overnight (3,154 frames, ~6 s/frame on the GTX 1060, 5.5 h) WITHOUT an approved animatic. A whole night wasted. Rule: animatic gate.
- Static picture: kit/qa/alive_check.py on v1 = 45 % of frames near-identical, 54.6 s of frozen picture, 85 failures. Steve only switched between poses and slid; the building, rope and camera were dead. New skill skills/ours/always-alive-3d (mandatory) + the 12-principles skills.
- Out of sync: the audio in the MP4 was at offset 0.000 s, but faster-whisper word timings were 0.34 s early on median (worst 1.5 s), so captions, props and reactions were all off. Nobody measured. New kit/qa/sync_check.py (energy onsets vs sentence starts, limit 0.08 s; --fix snaps sentences to the nearest onset, which can pick the wrong onset when a sentence is more than ~0.5 s off: re-align first). Events must hang on words, not seconds (v1 hard-coded seconds).
- Music: the generated bed (plucks + brushes at full level) was "too loud and annoying". Rule: 18-20 dB under the voice, no busy percussion, out on gags.
- Things that read as glitches: drawn white speed lines; chromatic fringing + bloom on an over-bright white shirt (purple halo around Steve); the wheel sunk into the roof slab and the rope passing through the floor; the lagging-hair gag (looked like a beard / a crown stuck in his chest). Rules in always-alive-3d section 6.
- make.ps1 ran sfxmix AFTER encode (silent MP4 until a second encode job). Fixed: sound steps now come before render/encode.
- Blender/Eevee test (Blender 5.2 via computer use, exec of a build script in the Python console): 6.3 s/frame vs 14.5 s for our tracer at 1440p, but the user rejected the look. ArrayModifier offset is `constant_offset_displace`.
- Voice: the user records the script himself (sped up 1.12x with atempo). The Kokoro read was "dull".
- opus-sound-layer on the PC: kit of ~1,100 CC0 sounds + Openverse search works (make step sfxkit); CC0 music search found nothing usable; mix.py takes absolute paths and has no trim/gain per cue (use short sounds, weight hero/support).
- The runner must be started from HowItReallyWorks\ (the -portable copy watches another jobs folder).

## 2026-11-10 - video 3 look tests (ray-marched path tracer on the GTX 1060)
- Target audience is teens+: adult proportions, deadpan humour, semi-realistic materials. A round clay-toy Steve "looks for kids".
- Page: videos/steve-elevator/web (scene.glsl.js + short.html). 1080x1920 inside, 8 spp + a-trous denoiser (albedo-demodulated, G-buffer via MRT) = ~9 s per still, ~6 s/frame average in the film; 4K 32 spp = 106 s.
- ANGLE/D3D11 (fxc) unrolls and inlines every loop: use `#define ZERO (min(int(uSeed),0))` in every loop bound, one call site for map/march/direct, compile after window load with KHR_parallel_shader_compile (~20 s; first draw adds ~20 s more).
- `gl.finish()` does not block in Chrome: wait with fenceSync + clientWaitSync polled via setTimeout, or page.screenshot times out.
- Windows TDR (~2 s per GPU call): draw in 256x32 scissor blocks, tile the post pass too.
- RGBA32F textures with LINEAR filtering are incomplete (read as black): NEAREST for 32F, LINEAR only for 16F.
- lemo-opuscar: `git clone --depth 1 --filter=blob:none --sparse` works from the cloud; 66 styles have poster.jpg for a pick sheet.

## 2026-11-09 - video 2 topic research
- ig-viral on YouTube works from the desktop browser: open youtube.com, then fetch('/@handle/shorts') in page JS and read overlayMetadata (title + views) from ytInitialData; ~10 channels in 2 calls. Some handles return no data (Lesics, ScienceInsider): try another spelling.
- hookscore.py rewards a number/name, a stakes word (not, never, wrong, still...), the payoff in the first 3 words and "you". Write the hook naturally first, then fix only what it flags; don't stuff keywords.
- lemo-opuscar setup.sh clones the library to /root/lemo-opuscar (deps not installed yet).



## 2026-11-09 - efficiency pass + new skills
- New PC action `make` runs a whole video in one job (kit/local/make.ps1, lives in the repo so it updates by itself); `selfupdate` swaps in the repo's runner and restarts it. local_render.mjs gained `events` mode (sound cues on the PC) and range `auto` (window.frames).
- Credit cost of v1 came mostly from step-by-step polling, a 200k-character recursive listing, and rebuilding audio after a container reset. Rules for this are in CLAUDE.md "Save credits".
- Added instagram-agent (MIT, 13 ig-* skills: hook scorer, caption humanizer, repurposer) to skills/vendor. everything-claude-code fork has no LICENSE: ideas in skills/notes/.
- `make` test on the PC (words + audio): 26 s + 57 s, all on the PC, no cloud audio step. Windows ffmpeg's limiter let true peak reach -0.1 dBTP (cloud gave -0.9): mix.py now re-renders 1 dB quieter whenever the peak is above -1 dBTP.
- User direction for next videos: context first (car -> engine -> cylinder), for every age; longer is fine if clearer (styles/STYLE.md).

## 2026-11-09 - first full GPU render (combustion engine Short)
- faster-whisper on Windows crashed in PyAV (`open() got an unexpected keyword argument 'metadata_errors'`): words.py now reads the WAV with numpy and passes the array. large-v3 int8 on the GTX 1060: ~45 s for 62 s of audio.
- Passing the script as initial_prompt makes Whisper hallucinate filler ("issippi") between sentences; align.py still matched well. Consider dropping the prompt or passing only key terms.
- Full Short at SCALE 2: 1876 frames in 260 s (0.139 s/frame). Encode (crf 17 veryfast) took ~90 s and gave 311 MB / ~37 Mbit/s because of film grain.
- The device bridge times out staging files that large: QA from sampled frames (every 125th) and leave the MP4 on the PC. Wait for the encode log's last line before staging the MP4 (the file exists while it is still being written).
- Cloud container resets lose gitignored audio: rebuild with audio_kit.py + mix.py (deterministic) from the voice file kept in hirw/in.

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

## 2026-11-08 — First HQ still on the PC (GTX 1060)
- Runner: a running PowerShell window keeps the old script. After updating runner.ps1, the user must close and reopen "2-START RUNNER". Jobs for unknown actions are logged "rejected: unknown action".
- HDRI job (Poly Haven studio_small_09, 2k, CC0) downloads in ~10 s on the PC. Cloud can't reach Poly Haven.
- Bug 1: renderer.setSize(W,H,false) leaves the canvas without CSS size. At deviceScaleFactor 2 it showed at double size (only a corner visible). Fix: canvas CSS width/height fixed to 1080x1920.
- Bug 2: Inter is not installed on Windows -> serif fallback. Fix: kit/fonts (Inter OFL) + inter.css, link it from every page, await document.fonts.load before rendering.
- Before sending a job to the PC, test the same script in the cloud: CLOUD_TEST=1 node kit/local/local_render.mjs still ... (SwiftShader, ~35 s load + 31 s render at 2x).
- Result: 2160x3840 still with GTAO + bloom + DOF + HDRI renders in 2.3 s on the GTX 1060. Metals finally read as chrome (HDRI reflections). To fix next: fin edges bloom too white, crank pin hot spot, hatch a bit busy.
- 1x vs 2x test (same hq.html, GTX 1060): 1x = 0.093 s/frame (65 s Short ~3 min). 1x shows jaggies on thin fin edges and hatch lines even with MSAA 8; 2x supersample + downscale is clean. Plan: 1x for drafts, 2x for the final, deliver 1080x1920 on every platform. The 2.3 s "still" time includes a 4K page screenshot; real 2x frame cost still to measure (frames mode needs a scale option).
- Edge headless (Playwright channel msedge, headless:true, --use-angle=d3d11) still uses the NVIDIA GPU on her PC: no window pops up, same speed (~0.1 s/frame). Off-screen window kept only as automatic fallback.
- Scale benchmark (90 frames, hq.html, GTX 1060, saved 1080x1920): 1x 0.10 s/frame, 1.5x 0.108, 2x 0.116. The GPU is not the bottleneck (JPEG encode/transfer is), so 2x costs almost nothing: a 65 s Short at 2x = ~4 min. Default for finals: render job with "scale":"2". Progress page: out\progress.html via "3-VIEW PROGRESS.bat".
- Her laptop webcam light flashed at each Edge launch (device probing at startup). Added --use-fake-device-for-media-stream, --deny-permission-prompts, --disable-features=MediaFoundationVideoCapture.
- Device bridge: committing the same stagedPath twice can write the OLD cached content (runner.ps1 stayed 3680 bytes after a 'written' result). Always stage under a new filename (runner_v4.ps1 -> runner.ps1) and check the size on the PC with device_list_dir afterwards.
