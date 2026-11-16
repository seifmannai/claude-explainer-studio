// kit/char2d/cast/dave.js - DAVE, the channel's inventor (introduced in video 4, "Dave builds a touchscreen").
// Character bible: kit/char2d/cast/DAVE.md. Use Dave.pose('poke', {...}) for a signature pose and Dave.costume for the look.
//
// Who he is: a self-taught garage inventor, early thirties, wildly optimistic, FAST to act and SLOW to see what he did.
// Three traits -> body:  eager  = leans in, rises on his toes, rubs his hands;
//                        overconfident = chest out, hands on hips, small smug nod before every try;
//                        sheepish after a fail = freezes, then a slow side-eye to camera, cap pushed back, scratches his neck.
// Timing: actions snap (10-frame moves), realisations are slow (hold 8-12 frames, then react).
(function (g) {
  const costume = {
    shirt: '#e8762d', pants: '#3a4256', skin: '#f3dcc0', hairCol: '#6b3f22', hat: 'cap', hatCol: '#2f6f9e', tieOn: 0, stubble: 0,
    goggles: 1, pencil: 1, toolbelt: 1, nose: 1, freckles: 1, plaster: 1, tuft: 1, seed: 3,
  };
  // signature poses (hand offsets are from the feet, y up; ~540 units = full height)
  const P = {
    eager: { expr: 'idea', mouth: 'grin', open: 0.3, lid: [0.95, 0.95], handL: [-30, 300], handR: [32, 305], lean: -0.06, hip: [0, 6], footL: [-30, 6], footR: [30, 6] },   // rubbing hands, on his toes
    proud: { expr: 'smug', handL: [-108, 214], handR: [104, 210], lean: 0.04, shoulders: 10, tilt: 0.08 },                                                      // hands on hips, chest out
    poke: { expr: 'deadpan', lid: [0.85, 0.85], brow: [[6, 0.2], [6, 0.2]], mouth: 'side', pointR: 1, lean: -0.16, handL: [-70, 230] },                       // focused, tongue-in-cheek
    pokeHard: { expr: 'angry', pointR: 1, lean: -0.2, handL: [-90, 260], tilt: -0.06 },
    eureka: { expr: 'idea', pointR: 1, handR: [60, 540], handL: [-70, 240], lid: [1.1, 1.1], open: 0.6, hatTip: 0.25, hip: [0, 10] },                         // finger up, cap pops
    think: { expr: 'suspicious', handR: [40, 368], pointR: 0.6, look: [0.35, 0.6], brow: [[14, -0.1], [-2, 0.2]], mouth: 'side', tilt: -0.08 },             // finger tapping chin, eyes up
    puzzled: { expr: 'suspicious', capBack: 1, handL: [-64, 470], handR: [70, 230], mouth: 'side', look: [-0.3, 0.2], tilt: 0.1 },                              // scratches under the cap
    sideEye: { expr: 'deadpan', lid: [0.42, 0.42], look: [-0.9, -0.15], brow: [[-6, 0.05], [-2, 0]], mouth: 'flat', handL: [-62, 210], handR: [70, 215] }, // slow look to camera after a fail
    caught: { expr: 'panic', handL: [-150, 470], handR: [150, 480], mouth: 'o', open: 0.7, sweat: 0.6, hair: 0.4, tie: 0, lean: 0.05 },                        // hands up, guilty
    scared: { expr: 'panic' },
    sheepish: { expr: 'defeat', capBack: 0.6, handR: [64, 440], look: [-0.6, 0.1], mouth: 'side', blush: 0.6 },
    joy: { expr: 'relief', mouth: 'grin', open: 0.5, lid: [0.08, 0.08], handL: [-80, 300], handR: [80, 300], blush: 0.6 },                                    // tears-of-joy squint
    victory: { expr: 'idea', mouth: 'grin', open: 0.8, lid: [0.1, 0.1], handR: [128, 410], handL: [-90, 230], hip: [0, 14], lean: 0.06 },                    // fist pump
    defeat: { expr: 'defeat' },
    angry: { expr: 'angry' },
    swear: { expr: 'angry', handL: [-60, 320], handR: [60, 330], lean: 0.05 },
    hammerUp: { expr: 'angry', handR: [-30, 600], handL: [-110, 300], lean: 0.12, hip: [-10, 0], footL: [-50, 0] },                                          // wind-up: weight back
    shock: { expr: 'panic', handL: [-120, 300], handR: [130, 310], mouth: 'o', open: 1, sweat: 0.4 },
  };
  function pose(name, over) {
    const d = P[name] || {}, { expr, ...rest } = d;
    return Object.assign(Stick.pose(expr || 'deadpan', Object.assign({}, costume, rest)), over || {});
  }
  // calm idle so it never reads as random business; the acting keys carry the meaning
  const CALM = { eyes: 0.15, fidget: 0.3, shift: 0.5, sway: 0.6 };
  g.Dave = { costume, P, pose, CALM };
})(typeof window !== 'undefined' ? window : globalThis);
