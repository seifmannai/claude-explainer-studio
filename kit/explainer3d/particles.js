// GPU particles: every particle's position is computed in the vertex shader from (its seed, time),
// so tens of thousands of particles cost almost nothing on the CPU and every frame is deterministic.
// The video supplies the motion as GLSL:
//   void particle(vec4 s, float t, out vec3 p, out float a, out vec3 c, out float sz)
//   s = 4 random numbers in [0,1) per particle, t = seconds. Output position (world), alpha, linear colour, size multiplier.
// Helpers available in the GLSL: hash11, hash31, PI, ease(x) (smoothstep 0..1), uniforms you pass in.
import * as THREE from 'three';

const glslType = (v) => (Array.isArray(v) ? 'float' : typeof v === 'number' ? 'float' : v.isVector3 || v.isColor ? 'vec3' : v.isVector2 ? 'vec2' : v.isVector4 ? 'vec4' : 'float');

export function gpuParticles({ count = 5000, motion, uniforms = {}, size = 0.06, additive = true, seed = 1 }) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), sd = new Float32Array(count * 4);
  let x = seed * 9301 + 49297;
  const rnd = () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
  for (let i = 0; i < count * 4; i++) sd[i] = rnd();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));   // unused, required by three
  geo.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);    // never frustum-culled
  const u = { uT: { value: 0 }, uSize: { value: size }, uScale: { value: 1000 } };
  for (const k in uniforms) u[k] = { value: uniforms[k] };
  const decl = Object.keys(uniforms).map((k) => `uniform ${glslType(uniforms[k])} ${k}${Array.isArray(uniforms[k]) ? `[${uniforms[k].length}]` : ''};`).join('\n');
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `uniform float uT; uniform float uSize; uniform float uScale; ${decl}
      attribute vec4 aSeed; varying float vA; varying vec3 vC;
      #define PI 3.14159265
      float hash11(float n){ return fract(sin(n*127.1)*43758.5453); }
      vec3 hash31(float n){ return fract(sin(vec3(n, n+1.31, n+2.77)*vec3(127.1,311.7,74.7))*43758.5453); }
      float ease(float x){ x = clamp(x,0.,1.); return x*x*(3.-2.*x); }
      ${motion}
      void main(){ vec3 p; float a; vec3 c; float sz; particle(aSeed, uT, p, a, c, sz);
        vA = a; vC = c; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
        gl_PointSize = a > 0.002 ? max(1.0, uSize*sz*uScale/max(0.1,-mv.z)) : 0.0; }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      void main(){ float d = length(gl_PointCoord-0.5); float k = 1.0 - smoothstep(0.0, 0.5, d); k *= k;   // note: GLSL smoothstep needs edge0 < edge1
        if (k*vA < 0.002) discard; gl_FragColor = vec4(vC*k*vA, k*vA); }`,
  });
  if (!additive) mat.premultipliedAlpha = true;
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 10;
  /** call every frame: t seconds; camera for the point-size scale */
  pts.update = (t, camera, renderer) => {
    u.uT.value = t;
    const hPx = renderer.domElement.height;   // device pixels
    u.uScale.value = hPx / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  };
  pts.u = u;
  return pts;
}
