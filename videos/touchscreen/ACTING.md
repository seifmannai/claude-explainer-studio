# Acting sheet: Dave builds a touchscreen

Rule (user, 2026-11-16): **no pose without a reason.** Each beat = what Dave THINKS -> what he WANTS -> the pose that shows it.
Idle life is calm (Dave.CALM): breathing, blinks, small weight shifts. No random gestures, no random eye darts.
His eyes always look at something specific: the screen, the camera (after a fail), the engineer, the fly, the cat.
Tempo: actions snap (5-11 frames), realisations are slow (hold, THEN react). Character bible: kit/char2d/cast/DAVE.md.

| # | Line | Dave thinks / wants | Poses (key -> key) |
|---|---|---|---|
| 0 | Meet Dave. | "Hi, that's me" (shows off) | proud, nods to camera -> eager turn to the screen -> poke (finger lands ON the glass) |
| 0 | ...wants a screen | "Come on, work" | pokeHard (2nd poke, harder) -> waits, looking at the screen |
| 1 | feels his finger | (insert) | finger taps, 3rd tap slower = losing patience |
| 2 | and pokes back. | daydream | think (finger on chin, eyes up) -> bubble: mini-Dave gets booped by the screen -> joy giggle |
| 4 | Screens feel nothing. (1965) | "Hello? Anything?" | poke the scope -> hold -> pokeHard -> sideEye to camera ("...") |
| 5 | British radar engineer | "Who's this guy?" | eyes follow the engineer walking in -> engineer sips, raises a finger -> on "copies" Dave raises the SAME finger (copying him) |
| 9 | notices the theft | "Uh oh. Caught." | finger on the scope -> red lights converge on it -> caught (hands up) on "theft" |
| 9 | That's your touch. | "Oh! That's a feature!" | hands down, eager smile at the green ring |
| 10 | electricity is scary | "My finger... is sparking?!" | looks at his fingertip (sparks) -> shock -> jumps off the stool and runs |
| 13 | presses with a hammer | "I know how to press." | proud nod -> pulls the hammer from his tool belt -> hammerUp (weight back) -> strike: head hits the glass mid-swing |
| 14 | Not that hard, Dave. | "...oops" | frozen in the follow-through -> hammer slips and falls -> sheepish, slow sideEye to camera |
| 18 | Plan C is fired. | "You. Fly." | eyes track the fly circling his head -> swat on "fired" (misses), fly leaves |
| 20 | loses it in four minutes | "Where is it?!" | pats chest pocket -> bends to look under the bench -> panic at 4:00 -> slow turn: suspicious at the cat |
| 24 | winter comes | "So cold" | shivers, hugs himself, phone in the left hand, red mittens |
| 25 | Gloves don't conduct | "Why won't it...?" | pokes with the mitten -> nothing -> puzzled, looks at the mitten |
| 26 | Dave's face grease | "Hello? ...eww" | fries in one hand, phone call: phone to the cheek (that's the smear!) -> looks at the screen, disgusted |
| 30 | the screen can fold | "So cool" | holds the thin phone at his chest, folds it shut and open, delighted |
| 31 | The other way, Dave. | "What if...?" (overconfident) | tries it backwards -> SNAP -> holds two halves -> sheepish sideEye |
| 32 | a screen that pokes back | "It finally works!" | taps the new phone (joy) -> it buzzes -> a finger pops out and pokes his nose -> scream, throws it at the camera -> loops to shot 0 |

## Screen rules learned from the review
- A poke must END ON the glass: use Stick.reach(); if the arm can't reach, move Dave closer, never fake it.
- Held things (phone, hammer, fries, tea) are props IN the hand (pose.holdR/holdL), kept at chest height so the face stays visible.
- 1965 is old film, but the science (electricity, charges, alarms, the stamp) stays in colour on top: it is what we explain.
- Captions sit at y=1400: keep Dave's head above y=1250 in every framing (film.js moves captions down if a head is in the way).
