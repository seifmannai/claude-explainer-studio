# Engineering explainer channel: toolkit research (Nov 2026)

Goal: 3D engineering explainers (cars, engines, Wi-Fi, Bluetooth, chips) in the spirit of Branch Education, made end to end by Claude.

## Best fits (ranked)
1. sunxiayi/make-blender-education-video-skill (MIT): Blender, fact-checked educational films; demos "Inside NVIDIA H100", "four-stroke engine". Needs Blender + GPU: render on Asma's computer.
2. lemomo-ai/lemo-opuscar (MIT): 66 code-made film styles for Opus 5.5. For tech: teardown, circuit-board, glass-product, iso-infographic, white-model, blueprint, microscope, dataviz.
3. vincentsch/explainroo (MIT): explainers with local Kokoro voice + Whisper timing + canvas renderer.
4. SunandBean/paper2video (MIT): Three.js + 2D scenes, Kokoro, mechanical fact-check of every on-screen number. Use the plugin install, not the curl|bash option.
5. heygen-com/hyperframes: HTML-to-video engine for agents.
6. Tejashmakwana/motionmaxxing (no license file): quality pass that rates and fixes "AI slop" motion graphics.
7. xdis/opus-video-studio (MIT): 8 skills; video-explainer (canvas), video-floorplan (Three.js), video-lineart (Blender line-art) are relevant.
8. tuzhechen2005/opus-video-skills (MIT): kinetic-reel (three.js type) for intros/channel trailer; painted-animation (watercolour).

## Building blocks
- Three.js: CloudAI-X/threejs-skills, cesartevisual/threejs-skills. Manim: adithya-s-k/manim_skill. Remotion: remotion-dev/skills. Diagram motion: PHANTOMTONYT/motion-design-skills.
- Voice: Kokoro via kokoro-onnx (model on GitHub releases, works from the cloud workspace). Word timing: sherpa-onnx zipformer.
- Assets: KhronosGroup glTF-Sample-Assets, Poly Haven (CC0). Blender MCP (ahujasid/blender-mcp, MIT) on the user's computer.

## Inspiration lists
zhuyansen/awesome-claude-video-skills (180 repos), opusvideo/awesome-claude-video (Opus 5.5 videos + prompts), LeaddeOpenLab/awesome-opus-5-5-video-prompts (prompt library, explainers + 3D collections).

## Limits found
- YouTube is unreachable from the cloud workspace: style study needs screenshots or clips from the user (or the desktop browser, see LEARNINGS 2026-11-09).
- CPU render in the cloud ~2-4 s/frame: keep cloud videos 3-6 min; Blender hero shots on the user's GPU.

## Custom skills saved for the channel
tech-explainer-3d, explainer-diagrams, explainer-voice-and-reference, cartoon-audio-short (all in skills/ours).
