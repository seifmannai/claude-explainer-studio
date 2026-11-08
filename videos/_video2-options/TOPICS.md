# Video 2: topic options (2026-11-09)

Status: 3 options sent to the user, waiting for a pick. Then: script -> voice -> page -> one `make` job.

## Skills used (opened this session)
viral-hooks (SKILL + hooks-database), instagram-agent ig-reel (hooks.json, hookscore.py), ig-viral (method),
tech-explainer-3d, explainer-diagrams, lemo-opuscar (library cloned, 66 styles listed), kinetic-typography (moves, eye-catching rules).

## ig-viral pass (YouTube Shorts, public data, read via the desktop browser)
~400 Shorts, 10 engineering/science channels; ranked by views / the channel's own median.
Top outliers: Engineering Explained "Should you always press the handbrake button?" 42x, "Is skipping gears bad?" 25x;
Jared Owen "Inside of Big Ben" 28x; Steve Mould GelSight microscope 26x, "Your smartwatch is even more incredible" 13x, "This camera can SEE sound" 12x;
Real Engineering "Wildest take-off" 22x, "Why jet engines have a speed limit" 12x; Veritasium "cut the green rope?" 15x;
Animagraffs airliner brakes / APU 12x each; B1M 235 E 42nd St 12x; Branch Education "GPUs printed with light" 3.3x.
What over-indexes:
1. A question about something the viewer touches every day (handbrake, gears, smartwatch).
2. Airplanes (Animagraffs, Real Engineering both outlier on planes).
3. Seeing the invisible (sound, light, touch).
Sample: ~400 Shorts / 10 channels, outlier multiple only; titles, not spoken hooks (yt_dlp is blocked from the cloud). Medium confidence.

## Option A: The microwave (recommended)
Context path: kitchen -> popcorn bag -> the box -> door mesh -> magnetron -> invisible waves -> water molecules spinning -> hot/cold spots -> why the plate spins.
Re-hooks: "same band as your Wi-Fi" (2.4 GHz) / door holes smaller than the 12 cm wave / chocolate-bar hot spots ~6 cm apart.
Hooks: "Your microwave does not cook from the inside. Never did." (81 STRONG, myth-buster)
       "Why does your microwave plate spin? Without it, cold spots." (78, question)
       "Two billion times a second, your microwave twists your food." (58, specificity)
Facts checked: 2.45 GHz, wavelength ~12.2 cm, penetration ~1-4 cm (outside-in), NOT a water resonance, half-wave hot-spot spacing ~6 cm.

## Option B: How a 575-tonne plane flies
Context path: airport window -> A380 rolling -> hand out of a car window -> the wing -> air turned downward (smoke lines) -> flaps -> four forces.
Re-hooks: the "equal transit" school myth (NASA calls it incorrect) / flaps change the wing / 4 engines vs weight.
Hooks: "575 tonnes. Four blue whales' worth. And your plane still flies." (83 STRONG)
       "Stick your hand out a car window. That's how 575 tonnes fly." (51)
       "The wing story your school taught you is wrong." (45, myth; strong idea, weak score)
Facts checked: A380 MTOW 575 t (WV008, Guinness); equal-transit theory wrong per NASA Glenn; lift = flow turning + pressure (both correct).
Check before scripting: blue whale mass (~150 t) for "four whales".

## Option C: How your touchscreen feels you
Context path: thumb scrolling -> the glass -> exploded layers -> invisible grid of wires -> electric field -> finger borrows charge -> glove (nothing) vs sausage (works).
Re-hooks: glove fails / sausage works (2010 Korea winter story) / multi-touch pinch.
Hooks: "Not pressure. Your phone screen feels the electricity in your finger." (80 STRONG)
       "Your gloves can't work your phone. A sausage can." (49, best for kids)
Facts checked: capacitive sensing, insulating gloves block it, sausage works (moisture conducts). TED-Ed made a sausage video: our own angle and visuals only.
Avoid unverified "N scans per second" numbers.

## Note on hookscore.py
It is a keyword counter (its own docstring: AUC 0.56 within one creator). Used as a check, not a judge.
