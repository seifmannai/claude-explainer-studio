---
name: character-acting
description: How our drawn characters ACT (Dave, Steve, real people in flashbacks). Read before animating any character, writing pose keys or an ACTING.md. Every pose has a reason; no random gestures. Use with kit/char2d (Stick, Dave).
---

# Character acting: every pose means something

User rule (2026-11-16, after video 4 review): "Dave moves with no meaning, it looks like AI slop. Each pose must have a meaning."
Cause we found: stock expressions + `Stick.vary` random gestures + `Stick.alive` random eye darts every 0.9 s.
Sources: skills/vendor/rossark-motion-skill (section 5, acting), skills/vendor/emotional-narrative, skills/vendor/character-appeal,
skills/vendor/animation-principles (staging, secondary action). Lessons below are in our own words.

## 1. Write the acting sheet BEFORE any code (videos/<slug>/ACTING.md)
For every script line, one row: **what the character THINKS -> what he WANTS -> the poses that show it.**
If you can't say why a pose is there, it doesn't go in. Example: "Dave presses with a hammer" =
"I know how to press" -> smug nod -> hand goes to his tool belt -> pulls the hammer -> wind-up (weight back) -> strike.

## 2. Rules for the poses
1. **Eyes always look AT something** (`lookAt: [x, y]`): the screen, the other character, the fly, the camera after a fail.
   The head turns a little with them. Never random darts (use `Dave.CALM` / `alive(..., {eyes: .15})`).
2. **Contact is real.** A poke ends ON the glass (`at: [x, y]` -> `Stick.reach`). If the arm can't reach, move the
   character (step stool, closer mark). A held object is a prop IN the hand (`holdR/holdL`), never floating.
3. **Faces stay visible.** Props at chest height (phones ~140 units tall, hand y <= 200). A prop covers the face only
   when that IS the action (a phone call on the cheek), and only for that beat.
4. **Tempo is personality.** Dave: actions snap (4-9 frame moves), realisations are slow (hold 8-14 frames, then react).
5. **Thought before action**: a beat of "decide" (look at the target, small anticipation) before every big move.
6. **Reactions land on the word**, 0-3 frames early (`Words().at`).
7. **Fails have three beats**: freeze in the follow-through -> consequence (hammer falls, pieces fly) -> slow side-eye to camera.
8. **Idle is calm**: breathing, blinks, slow weight shift. Idle never adds gestures. `Stick.vary` is for crowds only.
9. **A strike hits mid-swing** at full speed, then follows through (rossark rule 13). Wind-up = weight back, opposite arm out.
10. **Props enter already moving** and leave by a path you can follow (thrown, falling with a bounce), never vanish.
11. **A recurring character copies his own habits**: Dave's eureka finger + cap pop, chin tap, cap pushed back when puzzled,
    side-eye to camera after a fail. Signature poses live in `kit/char2d/cast/<name>.js` (see `Dave.P`).

## 3. Code shape (kit)
```js
// keys: [t, poseName, overrides, frames]; overrides may hold at:[x,y], atL, lookAt:[x,y], holdR, pointR...
const p = acting([[C.wind, 'swear', { handR: [70, 190], lookAt: belt }, 7],
                  [C.hit - 0.17, 'pokeHard', { at: glass, holdR: 'hammer', holdAngR: -0.24, lookAt: glass }, 4]], t, X, Y, s);
```
`acting()` (videos/touchscreen/film/shots.js) = resolve each key (reach, lookAt) -> `Stick.act` between keys -> `Stick.alive(..., Dave.CALM)`.
Move it into kit/timeline when a second video uses it.

## 4. Review checklist (before showing the user)
- [ ] Every key pose in the code appears in ACTING.md with a reason.
- [ ] No frame where a hand pokes air, a prop floats, or a prop hides the face by accident.
- [ ] Eyes have a target in every shot; the target is visible or obvious.
- [ ] Each gag has anticipation, the hit, and a reaction you can read in silhouette.
- [ ] Captions (y=1400) never sit on a face (film.js drops them to 1640 when a head is there).
