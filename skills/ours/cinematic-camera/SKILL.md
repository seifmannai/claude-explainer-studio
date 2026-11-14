---
name: cinematic-camera
description: MANDATORY with always-alive-3d before planning or building any shot. How the studio's camera moves (orbit, crane, dolly, follow, whip, push, handheld, kick), how to plan a shot list for vertical 9:16 explainers, and how characters walk. Uses kit/camera/rigs.js and Stick.walk. Deeper film theory: skills/vendor/director-skill/references/cinematic-language.md.
---

# Cinematic camera: every shot is a move with a reason

User feedback on video 3 v2 (2026-11-14): "no cinematics, no walk animation, the camera looks so dull; I want the camera
to move a lot, like orbits". A drifting camera is not enough. Every shot is DESIGNED: a size, an angle, a move, a reason.

## 1. The shot list comes first (videos/<slug>/PLAN.md)
For every script line write one row: `word that cuts | shot size | angle | move | what the move reveals | transition`.
- Sizes for 9:16: wide = the whole machine/building (vertical subjects: shafts, towers, stairs); medium = character to the knees;
  close = head and shoulders, eyes one third from the top; insert = the mechanism (claw, wheel, door lock).
  One size tighter than you would use in 16:9. Never more than 2 shots in a row of the same size.
- Change angle every cut by at least 30 degrees (30-degree rule) or change the size a lot. Keep screen direction (180-degree rule).
- New shot every 2-4 s. A shot longer than 5 s must contain a move that reveals something new.
- Keep faces and key props in the middle 60 % of the frame height (captions live in the bottom 20 %).

## 2. The moves (kit/camera/rigs.js) and when to use them
| Move | Use it for | Numbers that work at 24 fps |
|---|---|---|
| Orbit (`Cam.orbit`) | hero reveals, "you invented the elevator", a new part appearing, transformation | 25-90 degrees over 2-4 s, eased; around the subject's chest height |
| Crane / boom (`Cam.crane`) | scale: the height of a shaft, a tower, "ninety floors" | rise 3-30 m with a tilt that keeps the subject framed |
| Dolly / truck (`Cam.dolly`) | follow a mechanism, travel along rails | constant speed, ease only at the ends |
| Follow (`Cam.follow`) | a moving car, a falling object, a walking character | camera lags 4-8 frames, then catches up (spring) |
| Push-in (`Cam.push`) | realisation, the punchline, "and stopped." | 10-25 % closer over the line |
| Pull-back | aftermath, defeat, a reveal of the mess | start AFTER the beat resolves |
| Whip pan (`Cam.whip`) | jump to the next idea or time | 6-8 frames, blur in the middle, overshoot 5 % on arrival |
| Dutch tilt | danger, "too fast" | 8-15 degrees, never more than one shot in a row |
| Handheld (`Cam.handheld`) | panic, falls | 0.3-1.0 degree, 3-7 Hz; only on panic shots |
| Kick (`Cam.kick`) | impacts | 5-8 frames, decaying |
| Dolly zoom | one rupture moment per film (the rope snaps) | fov 35 -> 60 while the camera pulls in to keep size |
- Every shot has one DOMINANT move plus the always-on breath (tiny drift, 0.1-0.3 degree). Two big moves at once read as chaos.
- Moves start 2-4 frames BEFORE the word they illustrate and settle ON the stressed word.
- Hard cut on action, match cut on shape (wheel -> clock), whip on a change of idea. A dissolve only for time passing.

## 3. Rhythm of a 2-minute vertical explainer
- Hook (0-3 s): a big move: fast orbit or crane reveal + an impact.
- Each "fix": insert of the mechanism (orbit around it), then a medium of the character reacting, then the wide showing it work.
- Gags: hold the frame steady for the beat (the stillness is the joke) BUT the character keeps acting; then a quick push.
- End: crane up and away from the world to the title.

## 4. Characters move through space
- Nobody slides. Any change of position is a walk (`Stick.walk`), a run, a jump or a fall with anticipation.
- Walk: 1 step = 12 frames (normal), 8 (hurry), 16 (tired). Contact -> down -> passing -> up; arms opposite the legs;
  hips bob 1-2 cm; head lags; turn the face toward the direction of travel (`turn`).
- Entrances and exits: walk into frame, never pop. A character turning round turns head first, then the body (2-4 frames later).

## 4b. Never the same position twice (user rule, 2026-11-14)
- Every line of the script gets a NEW body position: different arm gesture, stance, lean, head tilt, face turn. A pose
  that already appeared in the film is a bug, like a frozen frame. Use `Stick.vary(pose, uniqueSeed)` on every beat
  (seed = sentence index) on top of the expression; hand-pose the big moments.
- The character's place in the frame changes too: left third, right third, near, far, low, high - not always centred.

## 5. Checklist on the animatic contact sheet
- [ ] Every shot has a named move and a reason. No two consecutive shots with the same size and angle.
- [ ] At least one orbit or crane per fix / chapter; the hook opens on a move.
- [ ] Characters never slide; every displacement shows feet moving.
- [ ] Nothing important in the top 10 % or bottom 20 %; eyes one third from the top in closes.
