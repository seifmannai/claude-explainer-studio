// shared sea surface: h(x, z, t) and slope, faded out with distance from the camera ground point
const W = [ // [amp, wavelength, dir deg, phase]
  [0.10, 9.0, 20, 0.0], [0.07, 5.5, 75, 1.3], [0.035, 3.2, -30, 2.1], [0.02, 1.7, 130, 0.4],
];
let CH = 1;
export const setChop = (c) => { CH = c; };
export const wave = (x, z, t, fade = 1) => {
  let h = 0, dx = 0, dz = 0;
  for (const [a, L, d, ph] of W) {
    const k = (2 * Math.PI) / L, w = Math.sqrt(9.81 * k), r = (d * Math.PI) / 180, cx = Math.cos(r), cz = Math.sin(r);
    const s = k * (x * cx + z * cz) - w * t * 0.8 + ph, A = a * CH * fade;
    h += A * Math.sin(s); dx += A * k * cx * Math.cos(s); dz += A * k * cz * Math.cos(s);
  }
  return [h, dx, dz];
};
