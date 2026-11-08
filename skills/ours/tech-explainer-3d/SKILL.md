---
name: tech-explainer-3d
description: Build clean 3D engineering explainer shots (engines, chips, Wi-Fi, Bluetooth) in Three.js, rendered frame by frame to MP4: lighting, cutaways, exploded views, signal paths, labels, assets.
---

# Tech explainer 3D (Three.js, frame-by-frame)

Goal: Branch-Education-style clarity (clean, well-lit objects, cutaways, glowing signal paths, calm camera), in our own look. Never copy another channel's shots, models or graphics.
Condensed from skills/vendor/threejs-* and threejs-mini, plus our own render lessons (LEARNINGS.md).

## 0. Start from the kit
Reuse kit/toon-engine (renderer, post chain, render.mjs, sheet.py, finish.sh). Only write the new scene/story files. Never rebuild the engine from scratch.

## 1. Render contract (deterministic)
- Page exposes `window.renderFrame(f)` and `window.ready`; every pose, camera and effect is a pure function of the frame number. No clocks, no unseeded random.
- Playwright Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`; grab `canvas.toDataURL('image/jpeg', .95)`; write via tmp file + rename; support RESUME=1.
- Budget: CPU WebGL ~2-4 s/frame at 1080p. Keep cloud videos 3-6 min; render in the background and expect container restarts (resume, don't restart).
- 1920x1080 for main videos, 1080x1920 for Shorts. Horizontal half-width = d * tan(hfov/2).

## 2. Look: clean product-render style
- MeshStandard/MeshPhysical (metalness, roughness, clearcoat, transmission). PMREMGenerator + RoomEnvironment for reflections, a key DirectionalLight with soft shadows, a rim light.
- Tone mapping ACESFilmic or AgX; colour textures SRGBColorSpace, data maps linear.
- Palette: neutral world, one accent for the explained thing, one warning colour. Same every video (styles/STYLE.md).
- Post: render -> SSAO/GTAO -> selective bloom on emissive paths -> optional outline on focus part -> DOF on close-ups -> output.
- Shadow camera tight around the action per shot; bias -0.0005, normalBias ~0.02.

## 3. Explainer moves
- Cutaway: `material.clippingPlanes` + `renderer.localClippingEnabled = true`; animate the plane; cap the cut.
- Exploded view: per-part `explode` vector, position = base + explode * ease(t); stagger 3-6 frames; label as parts separate.
- X-ray: housing to transparent Physical (opacity 0.15, depthWrite false), inner parts solid.
- Signal/current/data flow: TubeGeometry on a CatmullRomCurve3 + emissive dashed shader (offset = f * speed) + bloom; packets along curve.getPointAt(u).
- Waves: animated rings or a shader plane, amplitude falls off with distance.
- Labels: canvas text on a camera-facing plane + leader line. Measure text and shrink until it fits. Check it isn't mirrored.
- Scale jumps (car -> engine -> piston): continuous push-in + soft dissolve; carry one object across.

## 4. Camera grammar
Wide establish -> push into the part -> slow orbit while explaining (never static > 4 frames) -> pull back to context. Smootherstep glides 30-90 frames; ease-out reveals; rack focus between parts.

## 5. Assets
- Procedural: Lathe (pistons, shafts), Extrude (brackets), Tube (wires), InstancedMesh (pins, cells, fins).
- glTF/GLB via GLTFLoader (+ Draco/Meshopt). Sources: KhronosGroup glTF-Sample-Assets, Poly Haven (CC0), the user's Blender exports. Record source + licence in the video's CREDITS.md.
- Optimise: `npx @gltf-transform/cli optimize in.glb out.glb --texture-compress webp`, textures <= 2048.
- Photoreal hero shots: skills/vendor/make-blender-education-video, rendered on the user's GPU computer.

## 6. Look check before any long render
Stills at each shot's middle and key actions -> contact sheet -> inspect -> send to the user. Traps: subject out of frame, camera inside geometry, labels cut/mirrored, halos round alpha cards (depth-mask threshold must match the colour pass), black silhouettes from back-light (light from camera side), background objects too big.
