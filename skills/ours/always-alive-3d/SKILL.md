---
name: always-alive-3d
description: The studio's quality bar for every 3D video. MANDATORY before building or rendering any 3D scene. Covers character acting, environment life, camera motion, sync to the voice, sound levels, render polish, and the gates a video must pass before a full render. Use it with skills/vendor/animation-principles (the 12 principles) and skills/vendor/shader-skills.
---

# Always alive: the 3D quality bar

The user's goal: awesome, high-quality 3D videos in mass production. The worst failure is a static picture:
a frozen character, a dead environment, a locked camera. Video 3 (Steve & the elevator, v1) failed exactly
that way, plus bad sync and a loud music bed. These rules exist so it never happens again.

**Rule zero: at any frame of the film, at least three things are moving: the character, the world, the camera.**

## 1. Characters act, always

Read `skills/vendor/animation-principles/principles/` (anticipation, follow-through-overlapping, arc,
secondary-action, slow-in-out, squash-stretch, timing, staging, exaggeration, appeal) before animating.

Every character on screen runs ALL of these layers, summed, every frame:

| Layer | What | Numbers |
|---|---|---|
| Breath | chest/shoulders rise, tiny head counter-move | 0.25-0.35 Hz, chest 6-10 mm, never a pure sine: add a second slower wave |
| Blink | both lids close and open | every 2-4 s, irregular (hash per character), 3 frames closed at 24 fps; double blink sometimes; always blink on a head turn |
| Eyes | saccades, look at what matters | a new target every 0.6-2 s; eyes lead the head by 2-4 frames; glance to camera on jokes |
| Weight | shift hip side to side, knees soften | every 3-6 s, 1-2 cm, eased 0.5 s |
| Head | micro tilts, nods on stressed words | 2-6 degrees; nod = 4 frames down, 6 back |
| Hands | fidget, grip, tap, adjust glasses/tie | one small business per 4-6 s of waiting |
| Secondary | hair, tie, clothes, held props lag behind | follow 2-4 frames late, overshoot 10-20 %, settle in 8-12 frames |

Every deliberate action has four parts. Never switch a pose in one frame, never linear-interpolate two poses:

1. **Anticipation** (2-6 frames): a small move the opposite way (crouch before a jump, lean back before a step).
2. **Action** on an arc, fast (3-8 frames for a snap move), with slow-in/slow-out.
3. **Overshoot** past the target by 5-15 %.
4. **Settle** with a damped spring (8-14 frames), offset per body part: hips first, chest +2 f, head +3 f,
   arms +3-4 f, hands +5 f, hair/tie +6 f. That offset IS the overlap.

Emotions are poses of the whole body, not just the face: panic = shoulders up, knees bent, arms wide, head pulled
back; defeat = shoulders drop over 12 frames, head sinks, a visible exhale; relief = one big breath out.
A reaction starts 0-3 frames BEFORE its word, never after.

No T-poses, no A-poses, no arms straight out, no mirrored left/right poses. Asymmetry always.
A character that only translates (slides) through space without body motion is a bug.

## 2. The world is alive

A building, a room or a machine is never a still image. Every shot has at least two of these, more on wide shots:

- **Light that moves**: lamps flicker 2-4 %, light sweeps as the car passes, sparks light the walls, clouds drift.
- **Machines that run**: wheels turn, ropes vibrate and sway, cables swing after a stop, counterweights pass,
  gears tick, fans spin, indicator lamps blink.
- **Air**: dust motes in light shafts, falling dust after an impact, steam, drips, flying paper.
- **Background life**: a neighbour walking in a room, a cat, a TV glow, a curtain moving, a pigeon on the roof.
- **Physics aftermath**: after any hit, things wobble, swing and settle for 0.5-1.5 s (rope, lamp, door, spring).

An impact has: 1-2 frame stretch before, the hit frame, camera kick, debris/dust/sparks, then a damped wobble.

## 3. The camera breathes

- No locked-off shots. Every hold drifts: a slow push (2-5 % over the shot), a small arc, or handheld micro-motion
  (0.1-0.3 degrees, low frequency). Nothing is static for more than 4 frames.
- Moves are eased (smootherstep), follow arcs, and overshoot slightly on fast reframes.
- The camera reacts: kick on impacts (7 frames, decaying), whip-pan between ideas, push-in on the punchline,
  tilt down with a fall but a beat late.
- Cut on action or on the word. Vary shot size: wide -> medium -> close -> insert. A new angle every 2-5 s.
- Depth of field on close-ups; motion blur on everything fast (spread the samples across the shutter time).

## 4. Sync is measured, not assumed

- The voice is never re-timed. Everything hangs on WORDS: events are written as `at("snap")`, never as seconds.
- Word timings must pass `kit/qa/sync_check.py` (compares each sentence start with the real speech onset in the
  waveform). Fail above 0.08 s. Whisper alignment was 0.35 s early on average in video 3: never trust it unchecked.
- Captions show from the word's start to the next chunk; 1-3 words; key word highlighted.

## 5. Sound sits under the voice

- Music bed: integrated loudness at least 18-20 dB under the voice, ducked further on speech, OFF on gags
  (silence makes the hit funnier). No busy percussion or bright plucks under narration.
- Every visible event has a sound within 1 frame; every sound has a visible cause.
- Final mix: -14 LUFS, true peak under -1 dBTP. The user listens to the animatic before any full render.

## 6. Render polish

- No effect that can read as a glitch: no drawn speed lines, no chromatic fringing on bright edges, no bloom halo
  around a character (white shirts stay under 0.8 albedo; only real light sources bloom).
- Objects never intersect or float: check every prop at its rest pose (wheel on its frame, rope through a hole).
- Path-traced look: 1080x1920 inside, 8 samples + denoiser, motion blur by spreading samples over the shutter.
- A gag must read in one second from a phone. If it needs explaining (the hair gag in v1), redesign it.

## 7. Gates: nothing renders overnight without these

1. `kit/qa/sync_check.py` passes.
2. **Animatic**: 540x960, 2 samples, full sound, whole film. The user watches it and approves.
3. `kit/qa/alive_check.py` on the animatic frames passes: no run of more than 4 near-identical frames,
   and no shot whose character region or background region is frozen.
4. Contact sheet of every shot reviewed for intersections, halos, bad framing.
5. Only then the full render. After it: the same checks again, then deliver.

## 8. Build so the next video is faster

- Characters, poses, idle layers, props, timeline helpers and checks live in `kit/` and are reused, never rewritten
  inside one video. A new pose or prop made for a video is added to the kit in the same commit.
- After every video: append to LEARNINGS.md what broke, why, and the rule that prevents it; update this skill
  when a rule was missing.
