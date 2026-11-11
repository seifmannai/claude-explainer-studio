// Steve & the elevator: the animated world (ray-marched SDF, path traced on the GPU).
// Everything that moves is driven by the uniform array P (set per frame in short.html).
window.SCENE_FS = `#version 300 es
precision highp float; precision highp int;
uniform vec2 uRes; uniform uint uSeed;
uniform vec3 uCamPos, uCamTgt, uLamp; uniform float uFov, uFocus, uAper;
uniform float P[44];
layout(location=0) out vec4 o; layout(location=1) out vec4 oN; layout(location=2) out vec4 oA;
#define ZERO (min(int(uSeed),0))
#define CARY P[0]
#define CARVIS P[1]
#define ROPEVIS P[2]
#define ROPESNAP P[3]
#define WHEELVIS P[4]
#define WHEELANG P[5]
#define TEETH P[6]
#define CLAWVIS P[7]
#define CLAWOUT P[8]
#define SPARK P[9]
#define STEVE vec3(P[10],P[11],P[12])
#define ARMS P[13]
#define CROUCH P[14]
#define SLUMP P[15]
#define HAIRUP P[16]
#define HAIRLAG P[17]
#define COFFEE P[18]
#define BAGLEN P[19]
#define CWVIS P[20]
#define CWY P[21]
#define MOTORVIS P[22]
#define MOTORSC P[23]
#define GOVVIS P[24]
#define GOVANG P[25]
#define GOVOUT P[26]
#define SPRINGVIS P[27]
#define DOOROPEN P[28]
#define DOORY P[29]
#define DOORVIS P[30]
#define BEAMVIS P[31]
#define CARBON P[32]
#define KEYSVIS P[33]
#define ROPECUT P[34]
#define STEVEVIS P[35]
#define ROOF P[36]
#define STEVEYAW P[37]
#define RAILVIS P[38]
#define POCKET P[39]
#define WALKPH P[40]

uint gs;
float rnd(){ gs = gs*747796405u + 2891336453u; uint w = ((gs >> ((gs >> 28u) + 4u)) ^ gs) * 277803737u; w = (w >> 22u) ^ w; return float(w) / 4294967295.0; }
float hash(float n){ return fract(sin(n)*43758.5453123); }
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x), mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5, s=0.; for(int i=ZERO;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float smin(float a, float b, float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }
float smax(float a, float b, float k){ return -smin(-a,-b,k); }
float sdBox(vec3 p, vec3 b){ vec3 q=abs(p)-b; return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.); }
float sdRBox(vec3 p, vec3 b, float r){ return sdBox(p,b-r)-r; }
float sdRect2(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdCapT(vec3 p, vec3 a, vec3 b, float ra, float rb){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-mix(ra,rb,h); }
float sdEll(vec3 p, vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.)/k1; }
float sdFlat(vec3 p, vec3 a, vec3 b, float wa, float wb, vec3 n){
  vec3 ba=b-a; float h=clamp(dot(p-a,ba)/dot(ba,ba),0.,1.); vec3 q=p-(a+ba*h);
  float dn=dot(q,n); float side=length(q-dn*n); return length(vec2(max(side-mix(wa,wb,h),0.), dn)) - 0.0035; }
// pop-in: shrink everything about a centre when vis < 1
float popd(float d, float vis){ return d + (1. - clamp(vis,0.,1.))*0.3; }   // grow-in: erodes until it vanishes

#define M_CONC 1.
#define M_BRICK 2.
#define M_RAIL 3.
#define M_OAK 4.
#define M_STEEL 5.
#define M_BRASS 6.
#define M_ROPE 7.
#define M_SKIN 8.
#define M_SHIRT 9.
#define M_PANTS 10.
#define M_SHOE 11.
#define M_HAIR 12.
#define M_EYE 13.
#define M_FRAME 14.
#define M_LIP 15.
#define M_TIE 16.
#define M_BELT 17.
#define M_CUP 18.
#define M_SLEEVE 19.
#define M_COFFEE 20.
#define M_LAMP 21.
#define M_CAGE 22.
#define M_WALLA 23.
#define M_WALLB 24.
#define M_GROUND 25.
#define M_CWT 26.
#define M_MOTOR 27.
#define M_BEAM 28.
#define M_BREAD 29.
#define M_DOOR 30.
#define M_SPRING 31.
#define M_FACADE 32.
vec2 U(vec2 a, float d, float m){ return d<a.x ? vec2(d,m) : a; }

const vec3 HEADC = vec3(0.0, 1.66, 0.02);
const vec3 EYEL = vec3(-0.034, 0.016, 0.074), EYER = vec3(0.034, 0.016, 0.074);

// ---------------- Steve (local: feet at origin, faces +z) ----------------
vec2 head(vec3 q){
  vec2 r = vec2(1e9,0.);
  float sk = sdEll(q - vec3(0.,0.012,-0.006), vec3(0.087,0.11,0.1));
  sk = smin(sk, sdEll(q - vec3(0.,-0.052,0.026), vec3(0.071,0.066,0.079)), 0.03);
  sk = smin(sk, sdEll(q - vec3(0.,-0.098,0.068), vec3(0.03,0.026,0.026)), 0.02);
  sk = smin(sk, min(sdEll(q - vec3(-0.046,-0.012,0.058), vec3(0.034,0.028,0.034)), sdEll(q - vec3(0.046,-0.012,0.058), vec3(0.034,0.028,0.034))), 0.02);
  sk = smin(sk, sdEll(q - vec3(0.,0.046,0.074), vec3(0.068,0.019,0.03)), 0.016);
  float nz = sdCapT(q, vec3(0.,0.032,0.092), vec3(0.,-0.02,0.117), 0.0105, 0.0155);
  nz = smin(nz, length(q - vec3(0.,-0.024,0.114)) - 0.0165, 0.01);
  sk = smin(sk, nz, 0.012);
  sk = smin(sk, min(sdEll(q-vec3(-0.088,0.0,-0.006), vec3(0.013,0.031,0.02)), sdEll(q-vec3(0.088,0.0,-0.006), vec3(0.013,0.031,0.02))), 0.008);
  sk = smax(sk, -(length(q - (EYEL + vec3(0.,0.002,0.008))) - 0.025), 0.012);
  sk = smax(sk, -(length(q - (EYER + vec3(0.,0.002,0.008))) - 0.025), 0.012);
  float open = mix(0.0105, 0.004, SLUMP);          // tired lids when slumped
  for (int i=ZERO;i<2;i++){ vec3 e = i==0 ? EYEL : EYER; float side = i==0 ? -1. : 1.;
    float shell = length(q - e) - 0.0212;
    float up = max(shell, -((q.y - e.y) - open - 0.08*(q.x - e.x)*side));
    float lo = max(shell, (q.y - e.y) + 0.0135);
    sk = smin(sk, min(up, lo), 0.003); }
  float lips = sdEll(q - vec3(0.,-0.058,0.097), vec3(0.027,0.011,0.012));
  sk = smin(sk, lips, 0.01);
  float smile = 0.006*(1. - ARMS) - 0.004*SLUMP;
  float groove = min(sdCap(q, vec3(-0.025,-0.061+smile,0.106), vec3(0.,-0.0565,0.111), 0.0022), sdCap(q, vec3(0.,-0.0565,0.111), vec3(0.025,-0.061+smile,0.106), 0.0022));
  sk = smax(sk, -groove, 0.002);
  sk = smin(sk, sdCapT(q, vec3(0.,-0.1,-0.012), vec3(0.,-0.23,-0.02), 0.047, 0.055), 0.03);
  float lipm = sdEll(q - vec3(0.,-0.058,0.099), vec3(0.026,0.0105,0.011));
  r = U(r, sk, (lipm < 0.002 && q.z > 0.09) ? M_LIP : M_SKIN);
  r = U(r, min(length(q-EYEL)-0.0188, length(q-EYER)-0.0188), M_EYE);
  float raise = 0.012*ARMS;
  float br = min(sdCapT(q, vec3(-0.058,0.06+raise,0.088), vec3(-0.014,0.07+raise,0.103), 0.0045, 0.006),
                 sdCapT(q, vec3( 0.058,0.047+raise*0.4,0.088), vec3( 0.014,0.05+raise*0.4,0.103), 0.0045, 0.006));
  r = U(r, br, M_HAIR);
  // hair: lifted by HAIRUP, can lag behind the head (HAIRLAG, metres)
  vec3 hq = q - vec3(0., HAIRLAG, 0.);
  float cap = sdEll(hq - vec3(0.,0.036,-0.014), vec3(0.093,0.088,0.106));
  float hl = hq.y - (0.06*smoothstep(-0.02,0.07,hq.z) - 0.035*(1.-smoothstep(-0.09,-0.01,hq.z)));
  cap = max(cap, -hl);
  for (int i=ZERO;i<11;i++){ float fi=float(i); float a = (fi/10.)*2.6 - 1.3;
    vec3 b = vec3(sin(a)*0.062, 0.085 - 0.01*abs(sin(a)), 0.03*cos(fi*1.7) - 0.01);
    float up = mix(0.015, 0.045 + 0.03*hash(fi+3.), HAIRUP);
    vec3 t = b + vec3(sin(a)*0.035 + 0.01*hash(fi), up, mix(-0.05, -0.035 + 0.05*hash(fi+7.), HAIRUP));
    cap = smin(cap, sdCapT(hq, b, t, 0.026, 0.006), 0.018); }
  cap += 0.0018*sin(hq.x*260. + hq.z*90.)*sin(hq.y*180. - hq.z*60.);
  r = U(r, cap, M_HAIR);
  vec3 g = q - vec3(0.,0.024 + 0.006*ARMS,0.109); g.xy = rot(0.09*ARMS)*g.xy;
  float fr = 1e9;
  for (int i=ZERO;i<2;i++){ float sx = i==0?-1.:1.;
    vec2 c = g.xy - vec2(sx*0.034, 0.);
    fr = min(fr, max(abs(sdRect2(c, vec2(0.026,0.017), 0.007)) - 0.0024, abs(g.z) - 0.0025));
    fr = min(fr, sdCap(g, vec3(sx*0.06,0.006,0.), vec3(sx*0.087,0.008,-0.09), 0.0022)); }
  fr = min(fr, sdCap(g, vec3(-0.009,0.006,0.002), vec3(0.009,0.006,0.002), 0.0022));
  r = U(r, fr, M_FRAME);
  return r;
}

vec2 steve(vec3 p){
  vec2 r = vec2(1e9,0.);
  // walking: small bob + leg swing
  float wk = sin(WALKPH); float bob = abs(sin(WALKPH))*0.025*step(0.001, abs(WALKPH));
  float cr = CROUCH*0.2;
  vec3 up = p + vec3(0., cr - bob, 0.);                    // upper body sits lower when crouched
  // head (slump tips it forward)
  vec3 hq = up - HEADC; hq.yz = rot(-0.45*SLUMP)*hq.yz; hq.y += 0.03*SLUMP;
  float hb = length(hq) - 0.2;
  r = hb < 0.05 ? head(hq) : vec2(hb, 0.);
  float tor = sdCapT(up, vec3(0.,0.93,0.), vec3(0.,1.3,0.025 + 0.05*SLUMP), 0.135, 0.148);
  tor = smin(tor, sdEll(up - vec3(0.,1.3,0.025 + 0.05*SLUMP), vec3(0.178,0.125,0.108)), 0.06);
  tor = smin(tor, min(sdEll(up-vec3(-0.168,1.395 - 0.04*SLUMP,0.005), vec3(0.07,0.05,0.062)), sdEll(up-vec3(0.168,1.395 - 0.04*SLUMP,0.005), vec3(0.07,0.05,0.062))), 0.045);
  tor += 0.004*sin(up.y*70. + sin(up.x*25.)*2.)*smoothstep(1.35,0.95,up.y);
  // arms: relaxed (coffee at chest) -> panic (right hand on the rail, left up)
  vec3 sR=vec3(0.19,1.4 - 0.04*SLUMP,0.), sL=vec3(-0.19,1.4 - 0.04*SLUMP,0.);
  vec3 eR=mix(vec3(0.24,1.12,0.02 - 0.06*wk), vec3(0.44,1.17,-0.03), ARMS), wR=mix(vec3(0.25,0.86,0.06 - 0.1*wk), vec3(0.69,1.06,-0.09), ARMS);
  wR = mix(wR, vec3(0.2,0.9,-0.02), POCKET);                 // hand into the pocket
  vec3 eL=mix(vec3(-0.24,1.12,0.07), vec3(-0.38,1.19,0.1), ARMS), wL=mix(vec3(-0.2,1.2,0.26), vec3(-0.335,1.43,0.2), ARMS);
  eL = mix(eL, vec3(-0.24,1.12,0.02 + 0.06*wk), SLUMP); wL = mix(wL, vec3(-0.25,0.86,0.06 + 0.1*wk), SLUMP);
  eR = mix(eR, vec3(0.24,1.12,0.02 - 0.06*wk), SLUMP*(1.-ARMS));
  float upper = min(sdCapT(up, sR, eR, 0.056, 0.046), sdCapT(up, sL, eL, 0.056, 0.046));
  float cuff = min(sdCapT(up, mix(sR,eR,0.82), eR + (eR-sR)*0.06, 0.052, 0.05), sdCapT(up, mix(sL,eL,0.82), eL + (eL-sL)*0.06, 0.052, 0.05));
  tor = smin(tor, min(upper, cuff), 0.03);
  r = U(r, tor, M_SHIRT);
  float col = length(vec2(length(up.xz - vec2(0.,0.008)) - 0.062, up.y - 1.455)) - 0.013;
  r = U(r, max(col, -(up.z + 0.02)), M_SHIRT);
  r = U(r, sdEll(up - vec3(0.,1.425,0.088), vec3(0.019,0.022,0.014)), M_TIE);
  // tie: hangs down when calm, flips over the shoulder in a panic
  vec3 t0=vec3(0.,1.41,0.095), t1=mix(vec3(0.,1.3,0.11), vec3(0.035,1.5,0.14), ARMS), t2=mix(vec3(0.,1.18,0.12), vec3(0.115,1.575,0.12), ARMS), t3=mix(vec3(0.,1.08,0.115), vec3(0.2,1.6,0.05), ARMS);
  float tie = min(sdFlat(up, t0, t1, 0.018, 0.026, normalize(vec3(0.,-0.1,1.))), sdFlat(up, t1, t2, 0.026, 0.034, normalize(vec3(0.,-0.1,1.))));
  tie = min(tie, sdFlat(up, t2, t3, 0.034, 0.012, normalize(vec3(0.,0.2,1.))));
  r = U(r, tie, M_TIE);
  float fa = min(sdCapT(up, eR, wR, 0.04, 0.031), sdCapT(up, eL, wL, 0.04, 0.031));
  float hR = sdEll(up - wR - normalize(wR-eR)*0.04, vec3(0.044,0.046,0.044));
  float hL = sdEll(up - wL - normalize(wL-eL)*0.04, vec3(0.042,0.05,0.036));
  r = U(r, smin(fa, min(hR, hL), 0.025), M_SKIN);
  // legs (crouch bends the knees, walk swings them)
  float hipY = 0.86 - cr;
  vec3 kL = vec3(-0.12, 0.47 - cr*0.4, 0.06 + cr*0.5 + 0.12*wk), kR = vec3(0.14, 0.47 - cr*0.4, 0.05 + cr*0.5 - 0.12*wk);
  vec3 aL = vec3(-0.13, 0.08, -0.01 + 0.1*wk), aR = vec3(0.15, 0.08, -0.03 - 0.1*wk);
  float pel = sdEll(p - vec3(0.,hipY + 0.03 + bob,0.), vec3(0.158,0.1,0.112));
  float lg = min(min(sdCapT(p, vec3(-0.095,hipY,0.), kL, 0.078, 0.058), sdCapT(p, kL, aL, 0.056, 0.042)),
                 min(sdCapT(p, vec3(0.095,hipY,0.), kR, 0.078, 0.058), sdCapT(p, kR, aR, 0.056, 0.042)));
  float pants = smin(pel, lg, 0.05) + 0.003*sin(p.y*60. + p.x*30.);
  r = U(r, pants, M_PANTS);
  r = U(r, max(abs(p.y - (hipY + 0.095 + bob)) - 0.02, min(tor, pants) - 0.006), M_BELT);
  r = U(r, min(sdEll(p - aL - vec3(0.,-0.04,0.05), vec3(0.052,0.045,0.13)), sdEll(p - aR - vec3(0.,-0.04,0.05), vec3(0.052,0.045,0.13))), M_SHOE);
  // coffee cup in the left hand
  if (COFFEE > 0.5) {
    vec3 cc = wL + vec3(0.,0.07,0.02);
    vec3 cq = up - cc; cq.xy = rot(0.28*ARMS)*cq.xy;
    float rr = mix(0.031, 0.042, clamp((cq.y + 0.07)/0.14, 0., 1.));
    float cup = max(length(cq.xz) - rr, abs(cq.y) - 0.07);
    cup = max(cup, -max(length(cq.xz) - rr + 0.0028, -(cq.y + 0.064)));
    r = U(r, cup, abs(cq.y + 0.005) < 0.03 ? M_SLEEVE : M_CUP);
    if (ARMS > 0.5) {
      vec3 top = cc + vec3(-0.02,0.07,0.);
      float cf = 1e9;
      for (int i=ZERO;i<6;i++){ float fi=float(i);
        cf = smin(cf, length(up - top - vec3(-0.012*fi + 0.003*fi*fi, 0.032*fi - 0.0012*fi*fi, 0.004*fi)) - (0.022 - 0.0026*fi), 0.02); }
      for (int i=ZERO;i<6;i++){ float fi=float(i);
        cf = min(cf, length(up - top - vec3((hash(fi)-0.5)*0.2, 0.12 + hash(fi+2.)*0.14, (hash(fi+4.)-0.5)*0.1)) - 0.008); }
      r = U(r, cf, M_COFFEE);
    } else r = U(r, max(length(up.xz - cc.xz) - 0.036, abs(up.y - cc.y - 0.06) - 0.004), M_COFFEE);
  }
  // baguette held out in the right hand (length BAGLEN)
  if (BAGLEN > 0.01) {
    vec3 a = wR + vec3(0.,0.02,0.02), b = a + normalize(vec3(-0.15,0.05,1.))*BAGLEN;
    float bg = sdCapT(up, a, b, 0.04, 0.045);
    bg += 0.004*sin(dot(up - a, normalize(b - a))*45.)*step(a.y + 0.02, up.y);
    r = U(r, bg, M_BREAD);
  }
  return r;
}

// ---------------- car (local: floor top at y=0, front edge z=0) ----------------
vec2 car(vec3 p){
  vec2 r = vec2(1e9,0.);
  r = U(r, sdRBox(p - vec3(0.,-0.06,-0.85), vec3(0.82,0.06,0.85), 0.012), M_OAK);
  r = U(r, sdRBox(p - vec3(-0.8,0.5,-0.85), vec3(0.022,0.5,0.85), 0.006), M_OAK);
  r = U(r, sdRBox(p - vec3( 0.8,0.5,-0.85), vec3(0.022,0.5,0.85), 0.006), M_OAK);
  r = U(r, sdRBox(p - vec3(0.,0.5,-1.68), vec3(0.82,0.5,0.022), 0.006), M_OAK);
  r = U(r, min(sdCap(p, vec3(-0.79,1.03,-1.66), vec3(-0.79,1.03,-0.02), 0.022), sdCap(p, vec3(0.79,1.03,-1.66), vec3(0.79,1.03,-0.02), 0.022)), M_BRASS);
  r = U(r, sdCap(p, vec3(-0.79,1.03,-1.66), vec3(0.79,1.03,-1.66), 0.022), M_BRASS);
  float posts = 1e9;
  for (int i=ZERO;i<2;i++){ float sx = i==0?-1.:1.;
    posts = min(posts, sdRBox(p - vec3(sx*0.8, 1.23, 0.0), vec3(0.045,1.23,0.045), 0.008));
    posts = min(posts, sdRBox(p - vec3(sx*0.8, 1.23, -1.7), vec3(0.045,1.23,0.045), 0.008));
    posts = min(posts, sdRBox(p - vec3(sx*0.8, 2.44, -0.85), vec3(0.045,0.045,0.85), 0.008)); }
  r = U(r, posts, M_OAK);
  vec3 q = p - vec3(0.,2.45,-0.85);
  float ch = sdRBox(q, vec3(0.86,0.075,0.085), 0.012);
  ch = min(ch, length(vec3(mod(q.x+0.06,0.12)-0.06, q.y, q.z-0.088)) - 0.011);
  r = U(r, ch, M_STEEL);
  // leaf spring + claws (appear with CLAWVIS; CLAWOUT flattens the spring and swings the claws out)
  if (CLAWVIS > 0.01) {
    float bow = mix(0.24, 0.17, CLAWOUT);
    float leaf = 1e9;
    for (int i=ZERO;i<4;i++){ float fi=float(i);
      float R = 1.9 + fi*0.05; vec2 c = vec2(0., 0.075 + bow - fi*0.022 - R);
      float arc = abs(length(q.xy - c) - R) - 0.009;
      arc = max(arc, abs(q.x) - (0.62 - fi*0.13)); arc = max(arc, abs(q.z) - 0.055); arc = max(arc, c.y + R*0.9 - q.y);
      leaf = min(leaf, arc); }
    leaf = min(leaf, sdRBox(q - vec3(0.,bow - 0.04,0.), vec3(0.05,0.05,0.07), 0.008));
    r = U(r, popd(leaf, CLAWVIS), M_STEEL);
    for (int i=ZERO;i<2;i++){ float sx = i==0?-1.:1.;
      vec3 c = q - vec3(sx*0.8, 0.0, 0.);
      float pv = max(length(c.xy) - 0.05, abs(c.z) - 0.07);
      vec3 d = c; d.x *= sx; d.xy = rot(mix(-1.35, -0.45, CLAWOUT))*d.xy;
      float claw = sdRBox(d - vec3(0.075, 0.0, 0.), vec3(0.085, 0.024, 0.05), 0.01);
      r = U(r, popd(min(pv, claw), CLAWVIS), M_BRASS);
      r = U(r, popd(sdCap(q, vec3(sx*0.6, bow - 0.15, 0.), vec3(sx*0.78, 0.035, 0.), 0.013), CLAWVIS), M_STEEL); }
  }
  return r;
}

// rope: car -> wheel (left side, x=0) and wheel -> counterweight (right side, x=1.4)
vec2 rope(vec3 p){
  if (ROPEVIS < 0.01) return vec2(1e9, 0.);
  float top = ROOF + 0.6;
  float y0 = CARY + 2.6;
  float rr = 1e9;
  vec3 q = p - vec3(0.,0.,-0.85);
  if (ROPESNAP < 0.5) {
    float yb = mix(top, y0, ROPEVIS);                   // rope drops down from the wheel as it appears
    rr = sdCap(q, vec3(0., yb, 0.), vec3(0., top, 0.), 0.03);
  } else {
    rr = sdCap(q, vec3(0., y0, 0.), vec3(0.015, y0 + 0.45, 0.), 0.03);           // stub on the car
    rr = min(rr, sdCap(q, vec3(0.05, ROPECUT, 0.), vec3(0., top, 0.), 0.03));    // hanging piece
    for (int i=ZERO;i<6;i++){ float fi=float(i); float a=fi*1.05;
      rr = smin(rr, sdCapT(q, vec3(0.015,y0+0.43,0.), vec3(0.015+0.07*cos(a), y0+0.53+0.04*hash(fi), 0.07*sin(a)), 0.011, 0.003), 0.01);
      rr = smin(rr, sdCapT(q, vec3(0.05,ROPECUT+0.02,0.), vec3(0.05+0.07*cos(a+0.4), ROPECUT-0.1-0.04*hash(fi+3.), 0.07*sin(a+0.4)), 0.011, 0.003), 0.01); }
  }
  if (CWVIS > 0.01) rr = min(rr, sdCap(q, vec3(1.4, CWY + 1.25, 0.), vec3(1.4, top, 0.), 0.03));
  rr += 0.0055*sin(atan(q.z, q.x - (q.x > 0.7 ? 1.4 : 0.))*3. + p.y*70.)*(1. - CARBON*0.8);
  return vec2(rr, M_ROPE);
}

// roof machinery: wheel (+crank), giant/tiny motor, governor
vec2 roofkit(vec3 p){
  vec2 r = vec2(1e9,0.);
  vec3 w = p - vec3(0.7, ROOF + 0.6, -0.85);
  if (WHEELVIS > 0.01) {
    vec3 wr = w; wr.xy = rot(WHEELANG)*wr.xy;
    float rim = max(abs(length(wr.xy) - 0.66) - 0.05, abs(wr.z) - 0.06);
    rim = smax(rim, -max(abs(length(wr.xy) - 0.7) - 0.015, abs(wr.z) - 0.02), 0.01);       // rope groove
    float spokes = 1e9;
    for (int i=ZERO;i<6;i++){ float a = float(i)*1.0472; spokes = min(spokes, sdCap(wr, vec3(0.), vec3(cos(a),sin(a),0.)*0.62, 0.025)); }
    float hub = max(length(wr.xy) - 0.09, abs(wr.z) - 0.1);
    float wheel = min(min(rim, spokes), hub);
    wheel = min(wheel, sdCap(w, vec3(0.,0.,0.), vec3(0.,0.,0.35), 0.03));                     // axle
    wheel = min(wheel, sdCap(w, vec3(0.,0.,0.35), vec3(0.18*cos(WHEELANG),0.18*sin(WHEELANG),0.35), 0.022));  // crank arm
    wheel = min(wheel, sdCap(w, vec3(0.18*cos(WHEELANG),0.18*sin(WHEELANG),0.35), vec3(0.18*cos(WHEELANG),0.18*sin(WHEELANG),0.5), 0.025));
    // stand
    wheel = min(wheel, min(sdCap(w, vec3(-0.5,-0.85,-0.2), vec3(0.,0.,-0.2), 0.035), sdCap(w, vec3(0.5,-0.85,-0.2), vec3(0.,0.,-0.2), 0.035)));
    r = U(r, popd(wheel, WHEELVIS), M_STEEL);
  }
  if (MOTORVIS > 0.01) {
    vec3 m = (p - vec3(1.95, ROOF + 0.6, -0.85)) / MOTORSC;
    float body = max(length(m.yz) - 0.45, abs(m.x) - 0.55);
    body = min(body, sdRBox(m - vec3(0.,-0.5,0.), vec3(0.6,0.1,0.5), 0.03));
    float fins = max(abs(fract(m.x*8.)-0.5)*0.125 - 0.02, max(length(m.yz) - 0.5, abs(m.x) - 0.45));
    body = min(body, fins);
    float d = popd(body * MOTORSC, MOTORVIS);
    r = U(r, d, M_MOTOR);
    r = U(r, popd(sdCap(p, vec3(0.7, ROOF + 0.6, -0.85), vec3(1.95 - 0.55*MOTORSC, ROOF + 0.6, -0.85), 0.04), MOTORVIS), M_STEEL);
  }
  if (GOVVIS > 0.01) {
    vec3 g = p - vec3(-0.55, ROOF + 0.55, -0.85);
    vec3 gr = g; gr.xy = rot(GOVANG)*gr.xy;
    float gw = max(abs(length(gr.xy) - 0.25) - 0.03, abs(gr.z) - 0.04);
    gw = min(gw, max(length(gr.xy) - 0.05, abs(gr.z) - 0.08));
    // flyweights on arms: swing out with GOVOUT
    vec3 gs2 = g; gs2.xz = rot(GOVANG*2.)*gs2.xz;
    float ang = mix(0.35, 1.2, GOVOUT);
    for (int i=ZERO;i<2;i++){ float sx = i==0?-1.:1.;
      vec3 tip = vec3(sx*sin(ang)*0.32, 0.25 + cos(ang)*0.32*0.4, 0.);
      gw = min(gw, sdCap(gs2, vec3(0.,0.25,0.), tip, 0.015));
      gw = min(gw, length(gs2 - tip) - 0.07); }
    gw = min(gw, sdCap(g, vec3(0.,0.,0.), vec3(0.,0.32,0.), 0.02));
    r = U(r, popd(gw, GOVVIS), M_BRASS);
  }
  return r;
}

vec2 shaft(vec3 p){
  vec2 r = vec2(1e9,0.);
  float ax = abs(p.x);
  float belowRoof = p.y - (ROOF + 0.16);
  // ground with the pit hole
  float foot = sdBox(vec3(p.x - 0.1, 0., p.z + 0.69), vec3(1.6, 1., 1.19));
  r = U(r, min(max(p.y + 0.16, -foot), p.y + 1.25), M_GROUND);
  // floor slabs: left rooms x<-1.2, right rooms x>1.65, building |x|<4
  float sy = p.y - 3.6*floor(p.y/3.6 + 0.5);
  float side = p.x < 0. ? (-1.2 - p.x) : (p.x - 1.65);
  float slab = max(max(abs(sy) - 0.16, -side), max(p.z - 0.5, -2.9 - p.z));
  slab = max(slab, max(ax - 4., belowRoof));
  slab = max(slab, -p.y - 0.2);
  r = U(r, slab, M_CONC);
  // roof slab across everything
  r = U(r, sdBox(vec3(p.x, p.y - ROOF, p.z + 1.2), vec3(4., 0.16, 1.7)), M_CONC);
  // shaft walls (left wall has a doorway at DOORY)
  float wl = max(abs(p.x + 1.1) - 0.1, max(p.z - 0.5, -1.9 - p.z));
  wl = max(wl, max(belowRoof, -p.y - 1.3));
  if (DOORVIS > 0.5) wl = max(wl, -sdBox(p - vec3(-1.1, DOORY + 1.07, -0.8), vec3(0.2, 1.07, 0.5)));
  r = U(r, wl, M_CONC);
  float wr = max(abs(p.x - 1.1) - 0.1, max(p.z - 0.5, -1.9 - p.z));
  wr = max(wr, max(belowRoof, -p.y - 1.3));
  r = U(r, wr, M_CONC);
  // back wall (brick) behind shaft + counterweight lane
  r = U(r, max(max(abs(p.z + 1.88) - 0.06, max(p.x - 1.65, -1.2 - p.x)), max(belowRoof, -p.y - 1.3)), M_BRICK);
  // room back walls + facade sides
  float lvl = floor(p.y/3.6);
  r = U(r, max(max(abs(p.z + 2.8) - 0.1, -side), max(max(ax - 4., belowRoof), -p.y)), mod(lvl + step(0.,p.x),2.)<0.5 ? M_WALLA : M_WALLB);
  r = U(r, max(max(abs(ax - 3.95) - 0.05, max(p.z - 0.5, -2.9 - p.z)), max(belowRoof, -p.y)), M_FACADE);
  // guide rails with ratchet teeth (TEETH grows them)
  if (RAILVIS > 0.5) {
    float body = max(sdBox(vec3(ax - 0.96, 0., p.z + 0.85), vec3(0.045, 1., 0.075)), max(belowRoof, -p.y - 1.25));
    float f = fract(p.y / 0.14);
    float face = 0.915 - 0.055*f*TEETH;
    float teeth = max((face - ax)*0.85, abs(p.z + 0.85) - 0.055);
    teeth = max(max(teeth, ax - 1.0), max(belowRoof, -p.y - 1.25));
    r = U(r, min(body, teeth), M_RAIL);
  }
  // one caged work lamp per floor on the left wall
  vec3 lp = vec3(p.x + 0.94, p.y - 3.6*floor(p.y/3.6) - 2.9, p.z - 0.15);
  if (p.y < ROOF && p.y > 0.) {
    r = U(r, length(lp) - 0.045, M_LAMP);
    float cage = abs(length(lp) - 0.065) - 0.004; cage = max(cage, abs(sin(atan(lp.z, lp.y)*4.)) - 0.25);
    r = U(r, min(cage, sdRBox(lp - vec3(-0.05,0.,0.), vec3(0.025,0.04,0.04), 0.005)), M_CAGE);
  }
  // counterweight
  if (CWVIS > 0.01) {
    vec3 c = p - vec3(1.4, CWY + 0.6, -0.85);
    float cw = sdRBox(c, vec3(0.17, 0.6, 0.17), 0.02);
    cw = smax(cw, -(abs(fract(c.y*4.)-0.5)*0.25 - 0.115 + max(abs(c.x),abs(c.z)) - 0.17), 0.004);
    r = U(r, popd(cw, CWVIS), M_CWT);
  }
  // landing door on the left wall
  if (DOORVIS > 0.5) {
    r = U(r, sdRBox(p - vec3(-1.12, DOORY + 1.06, -0.8 + DOOROPEN*1.02), vec3(0.03, 1.04, 0.5), 0.01), M_DOOR);
    if (BEAMVIS > 0.01) {
      float bm = 1e9;
      for (int i=ZERO;i<5;i++) bm = min(bm, sdCap(p, vec3(-1.03, DOORY + 0.25 + float(i)*0.38, -1.3), vec3(-1.03, DOORY + 0.25 + float(i)*0.38, -1.3 + 1.0*BEAMVIS), 0.006));
      r = U(r, bm, M_BEAM);
    }
  }
  // buffer springs in the pit
  if (SPRINGVIS > 0.01) {
    for (int i=ZERO;i<2;i++){ float sx = i==0?-1.:1.;
      vec3 s = p - vec3(sx*0.5, -1.25, -0.85);
      float h = 0.55*SPRINGVIS;
      float coil = length(vec2(length(s.xz) - 0.14, mod(s.y + atan(s.z, s.x)/6.2832*0.1, 0.1) - 0.05)) - 0.018;
      coil = max(coil, max(-s.y, s.y - h));
      r = U(r, coil, M_SPRING); }
  }
  // keys on the pit floor
  if (KEYSVIS > 0.01) {
    vec3 k = p - vec3(0.3, -1.235, -0.45);
    float ring = length(vec2(length(k.xz) - 0.025, k.y)) - 0.004;
    float key = sdRBox(k - vec3(0.06,0.,0.01), vec3(0.04,0.004,0.01), 0.002);
    key = min(key, length(vec2(length(k.xz - vec2(0.035,0.01)) - 0.014, k.y)) - 0.005);
    r = U(r, popd(min(ring, key), KEYSVIS), M_BRASS);
  }
  return r;
}

vec2 map(vec3 p){
  vec2 r = shaft(p);
  vec2 q = rope(p); if (q.x < r.x) r = q;
  if (p.y > ROOF - 0.5) { q = roofkit(p); if (q.x < r.x) r = q; }
  if (CARVIS > 0.01) {
    vec3 cp = p - vec3(0., CARY, 0.);
    float cb = sdBox(cp - vec3(0.,1.3,-0.85), vec3(0.95,1.45,0.95));
    if (cb < r.x) {
      if (cb > 0.1) r = U(r, cb, 0.);
      else { vec3 c2 = (cp - vec3(0.,1.2,-0.85))/CARVIS + vec3(0.,1.2,-0.85); q = car(c2); q.x *= CARVIS; if (q.x < r.x) r = q; }
    }
  }
  if (STEVEVIS > 0.5) {
    vec3 sp = p - STEVE; sp.xz = rot(STEVEYAW)*sp.xz;
    float sb = sdBox(sp - vec3(0.,1.0,0.05), vec3(0.9,1.05,0.75));
    if (sb < r.x) { if (sb > 0.06) r = U(r, sb, 0.); else { q = steve(sp); if (q.x < r.x) r = q; } }
  }
  return r;
}

vec3 normal(vec3 p, float t){ float h = 0.0004 + 0.0002*t; vec3 n = vec3(0.);
  for (int i=ZERO;i<4;i++){ vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0); n += e*map(p + e*h).x; }
  return normalize(n); }
float march(vec3 ro, vec3 rd, float tmax, out vec2 hit){
  float t = 0.;
  for (int i=ZERO;i<300;i++){ hit = map(ro + rd*t); if (hit.x < 0.00025*(1.+t)) return t; t += hit.x*0.8; if (t > tmax) break; }
  return -1.;
}
float vis(vec3 ro, vec3 rd, float tmax){
  float t = 0.004;
  for (int i=ZERO;i<140;i++){ float h = map(ro + rd*t).x; if (h < 0.0004) return 0.; t += h*0.9; if (t > tmax) return 1.; }
  return 1.;
}

struct Mat { vec3 c; float rough; float metal; float spec; float sss; vec3 emit; };
float brickH(vec2 q){ q *= vec2(1./0.225, 1./0.075); float row=floor(q.y); q.x += 0.5*mod(row,2.);
  vec2 f = fract(q); return smoothstep(0.,0.06,f.x)*smoothstep(1.,0.94,f.x)*smoothstep(0.,0.13,f.y)*smoothstep(1.,0.87,f.y); }

Mat getMat(float m, vec3 p, inout vec3 n){
  Mat M; M.c=vec3(0.7); M.rough=0.6; M.metal=0.; M.spec=0.04; M.sss=0.; M.emit=vec3(0.);
  vec3 sp = p - STEVE; sp.xz = rot(STEVEYAW)*sp.xz;
  if (m==M_CONC){
    float g = fbm(p.xy*9. + p.z*3.);
    if (n.z > 0.7) M.c = vec3(0.66,0.63,0.58)*(0.8+0.3*g);
    else if (n.y > 0.7) { float pl=fract(p.x*2.6); M.c = vec3(0.42,0.27,0.16)*(0.8+0.25*fbm(vec2(p.x*2.6,p.z*30.)))*(0.7+0.3*smoothstep(0.,0.04,pl)); M.rough=0.35; }
    else if (n.y < -0.7) M.c = vec3(0.82);
    else M.c = vec3(0.5,0.49,0.47)*(0.75+0.35*g);
    M.rough = 0.8; M.c *= 1. - 0.35*smoothstep(0.55,0.8,fbm(vec2(p.x*1.3+p.z, p.y*0.6)*2.));
  }
  else if (m==M_BRICK){
    vec2 q = p.xy; float h = brickH(q); vec2 id = floor(q*vec2(1./0.225,1./0.075));
    float hx = brickH(q+vec2(0.004,0.)) - h, hy = brickH(q+vec2(0.,0.004)) - h;
    n = normalize(n - vec3(hx, hy, 0.)*0.6);
    M.c = mix(vec3(0.58,0.56,0.52), vec3(0.42,0.17,0.11)*(0.75+0.5*hash2(id)), h) * (0.8+0.3*fbm(q*25.));
    M.rough = 0.85;
  }
  else if (m==M_RAIL){ M.c = vec3(0.23,0.24,0.26); M.metal = 0.85; M.rough = 0.38 + 0.25*fbm(p.yz*30.);
    float rust = smoothstep(0.55,0.75,fbm(p.yz*8. + 3.)); M.c = mix(M.c, vec3(0.35,0.16,0.07), rust); M.metal *= 1.-rust; M.rough = mix(M.rough, 0.9, rust); }
  else if (m==M_STEEL){ M.c = vec3(0.3,0.31,0.33); M.metal = 0.9; M.rough = 0.32 + 0.15*fbm(p.xy*40.); }
  else if (m==M_BRASS){ M.c = vec3(0.86,0.62,0.3); M.metal = 1.; M.rough = 0.22 + 0.12*fbm(p.xy*50.); }
  else if (m==M_OAK){ vec3 lp = p - vec3(0.,CARY,0.);
    bool flr = abs(n.y) > 0.5;
    float along = flr ? lp.z : (abs(n.x) > 0.5 ? lp.z : lp.x);
    float across = flr ? lp.x : lp.y;
    float plank = floor(across*6.5); float g = fract(across*6.5);
    M.c = vec3(0.55,0.34,0.18)*(0.7+0.45*fbm(vec2(along*3. + plank*7.1, across*90.)))*(0.85+0.3*hash(plank));
    M.c *= 0.55 + 0.45*smoothstep(0.,0.035,g)*smoothstep(1.,0.965,g);
    M.rough = 0.45; M.spec = 0.05; }
  else if (m==M_ROPE){ vec3 hemp = vec3(0.62,0.5,0.32)*(0.8+0.25*sin(p.y*140. + atan(p.z+0.85,p.x)*3.));
    vec3 carb = vec3(0.03,0.03,0.035)*(0.8+0.4*step(0.5,fract(p.y*60. + atan(p.z+0.85,p.x)*0.95)));
    M.c = mix(hemp, carb, CARBON); M.rough = mix(0.9, 0.25, CARBON); M.spec = mix(0.04, 0.08, CARBON); }
  else if (m==M_SKIN){
    vec3 hq = sp + vec3(0., CROUCH*0.2, 0.) - HEADC;
    M.c = vec3(0.78,0.55,0.43); M.rough = 0.42; M.spec = 0.028; M.sss = 1.;
    M.c *= 0.94 + 0.08*fbm(hq.xy*180.);
    float beard = smoothstep(-0.01,-0.035,hq.y) * smoothstep(-0.04,0.02,hq.z) * step(length(hq), 0.13);
    beard = max(beard, smoothstep(0.012,0.,abs(hq.y+0.044)) * smoothstep(0.03,0.0,abs(hq.x)-0.008) * step(0.08,hq.z));
    M.c = mix(M.c, M.c*0.55, beard*(0.45 + 0.4*smoothstep(0.35,0.75, noise(hq.xy*900. + hq.z*500.))));
    M.c = mix(M.c, vec3(0.85,0.48,0.42), 0.3*smoothstep(0.03,0.0,length(hq - vec3(0.,-0.024,0.115))));
  }
  else if (m==M_LIP){ M.c = vec3(0.66,0.4,0.36); M.rough = 0.35; M.sss = 1.; }
  else if (m==M_EYE){
    vec3 hq = sp + vec3(0., CROUCH*0.2, 0.) - HEADC; vec3 e = hq.x < 0. ? EYEL : EYER;
    vec3 d = normalize(hq - e); vec3 gaze = normalize(vec3(0.42*(1.-SLUMP), 0.06 - 0.4*SLUMP, 1.));
    float ang = acos(clamp(dot(d, gaze),-1.,1.));
    float isz = mix(0.42, 0.34, ARMS);
    vec3 white = vec3(0.92,0.9,0.86) * mix(1., 0.85, smoothstep(0.6,1.4,ang));
    float iris = smoothstep(isz,isz-0.03,ang), pupil = smoothstep(mix(0.17,0.1,ARMS),mix(0.15,0.08,ARMS),ang);
    vec3 ic = mix(vec3(0.24,0.33,0.2), vec3(0.45,0.36,0.18), smoothstep(isz,0.1,ang));
    M.c = mix(white, ic, iris); M.c = mix(M.c, vec3(0.01), pupil); M.rough = 0.04; M.spec = 0.06; }
  else if (m==M_HAIR){ M.c = vec3(0.075,0.05,0.035); M.rough = 0.35; M.spec = 0.05; }
  else if (m==M_FRAME){ M.c = vec3(0.02); M.rough = 0.15; M.spec = 0.06; }
  else if (m==M_SHIRT){ M.c = vec3(0.64,0.72,0.82)*(0.92 + 0.12*fbm(sp.xy*30.)); M.rough = 0.85; M.sss = 0.3; }
  else if (m==M_PANTS){ M.c = vec3(0.12,0.13,0.15)*(0.85+0.25*fbm(sp.xy*60.)); M.rough = 0.8; }
  else if (m==M_BELT){ M.c = vec3(0.13,0.07,0.04); M.rough = 0.3; M.spec = 0.05; }
  else if (m==M_SHOE){ M.c = vec3(0.24,0.12,0.06); M.rough = 0.25; M.spec = 0.06; }
  else if (m==M_TIE){ float s = fract((sp.x + sp.y)*28.); M.c = mix(vec3(0.42,0.05,0.07), vec3(0.75,0.6,0.25), step(0.82, s)); M.rough = 0.5; }
  else if (m==M_CUP){ M.c = vec3(0.9,0.88,0.84); M.rough = 0.6; }
  else if (m==M_SLEEVE){ M.c = vec3(0.55,0.38,0.22); M.rough = 0.9; }
  else if (m==M_COFFEE){ M.c = vec3(0.09,0.04,0.015); M.rough = 0.04; M.spec = 0.05; }
  else if (m==M_BREAD){ M.c = vec3(0.8,0.52,0.22)*(0.85+0.2*fbm(sp.xy*80.)); M.rough = 0.7; }
  else if (m==M_LAMP){ M.emit = vec3(1.,0.72,0.4)*14.; }
  else if (m==M_BEAM){ M.emit = vec3(1.,0.08,0.05)*10.*BEAMVIS; }
  else if (m==M_CAGE){ M.c = vec3(0.12); M.metal = 0.8; M.rough = 0.4; }
  else if (m==M_WALLA){ M.c = vec3(0.55,0.32,0.26); M.rough = 0.9; }
  else if (m==M_WALLB){ M.c = vec3(0.24,0.36,0.38); M.rough = 0.9; }
  else if (m==M_GROUND){ M.c = vec3(0.36,0.35,0.33)*(0.8+0.3*fbm(p.xz*3.)); M.rough = 0.9; }
  else if (m==M_CWT){ M.c = vec3(0.12,0.12,0.13); M.metal = 0.5; M.rough = 0.5;
    M.c = mix(M.c, vec3(0.85,0.65,0.1), step(0.5, fract((p.x + p.y)*5.))*step(abs(p.y - CWY - 0.6), 0.5)*0.9); }
  else if (m==M_MOTOR){ M.c = vec3(0.12,0.3,0.55); M.metal = 0.3; M.rough = 0.35; }
  else if (m==M_DOOR){ M.c = vec3(0.6,0.62,0.64); M.metal = 0.8; M.rough = 0.3; }
  else if (m==M_SPRING){ M.c = vec3(0.75,0.2,0.12); M.metal = 0.6; M.rough = 0.35; }
  else if (m==M_FACADE){ M.c = vec3(0.78,0.74,0.68)*(0.85+0.2*fbm(p.yz*2.)); M.rough = 0.85; }
  return M;
}

const vec3 KEYD = vec3(-0.45, 0.55, 0.7);
const vec3 KEYC = vec3(0.75, 0.82, 0.95) * 1.6;
const vec3 SKYC = vec3(0.18, 0.22, 0.3);
vec3 sampleCone(vec3 d, float a){ vec3 u = normalize(cross(abs(d.y)<0.99?vec3(0,1,0):vec3(1,0,0), d)); vec3 v = cross(d,u);
  float r = a*sqrt(rnd()), t = 6.2831853*rnd(); return normalize(d + u*r*cos(t) + v*r*sin(t)); }
vec3 cosHemi(vec3 n){ float r=sqrt(rnd()), t=6.2831853*rnd(); vec3 u=normalize(cross(abs(n.y)<0.99?vec3(0,1,0):vec3(1,0,0), n)); vec3 v=cross(n,u);
  return normalize(u*r*cos(t) + v*r*sin(t) + n*sqrt(max(0.,1.-r*r))); }
vec3 brdf(Mat M, vec3 n, vec3 v, vec3 l, vec3 lc){
  float ndl = dot(n,l); vec3 dif;
  if (M.sss > 0.){ float w = 0.5*M.sss; float wr = max((ndl + w)/(1.+w), 0.);
    dif = M.c * (vec3(wr) + vec3(0.25,0.05,0.02)*M.sss*smoothstep(0.,0.6,wr)*smoothstep(1.,0.2,wr)); }
  else dif = M.c * max(ndl,0.);
  dif *= (1. - M.metal);
  vec3 h = normalize(l + v); float nh = max(dot(n,h),0.), nv = max(dot(n,v),1e-3), nl = max(ndl,0.);
  float a = max(M.rough*M.rough, 0.002), a2 = a*a; float dd = nh*nh*(a2-1.)+1.; float D = a2/(3.14159*dd*dd);
  float k = (M.rough+1.)*(M.rough+1.)/8.; float G = (nv/(nv*(1.-k)+k))*(nl/(nl*(1.-k)+k));
  vec3 F0 = mix(vec3(M.spec), M.c, M.metal); vec3 F = F0 + (1.-F0)*pow(1.-max(dot(h,v),0.),5.);
  return (dif + D*G*F/(4.*nv*max(nl,1e-3))*nl*3.14159) * lc;
}
vec3 C1(){ return vec3(-0.87, CARY+2.45, -0.85); }
vec3 C2(){ return vec3(0.87, CARY+2.45, -0.85); }
vec3 direct(vec3 p, vec3 n, vec3 v, Mat M){
  vec3 col = vec3(0.);
  for (int i=ZERO;i<2;i++){
    vec3 l, lc; float dl;
    if (i==0){ vec3 lp = uLamp + (vec3(rnd(),rnd(),rnd())-0.5)*0.09; l = lp - p; dl = length(l); l /= dl; lc = vec3(1.0,0.68,0.38)*2.6 / (dl*dl*0.6 + 0.25); dl -= 0.08; }
    else { l = sampleCone(normalize(KEYD), 0.14); lc = KEYC; dl = 40.; }
    if (dot(n,l) > -0.3) col += brdf(M, n, v, l, lc * vis(p + n*0.002, l, dl));
  }
  if (SPARK > 0.01) for (int k=ZERO;k<2;k++){ vec3 c = k==0?C1():C2(); vec3 sl = c - p; float d2 = dot(sl,sl);
    col += brdf(M, n, v, normalize(sl), vec3(1.,0.5,0.15) * 0.25*SPARK / (d2 + 0.03)); }
  if (BEAMVIS > 0.01) { vec3 sl = vec3(-1.03, DOORY + 1.0, -0.8) - p; col += brdf(M, n, v, normalize(sl), vec3(1.,0.1,0.06)*0.3*BEAMVIS/(dot(sl,sl)+0.2)); }
  return col;
}
float segDist(vec3 ro, vec3 rd, float tmax, vec3 a, vec3 b){
  vec3 ba=b-a, oa=ro-a; float d1=dot(rd,ba), d2=dot(ba,ba), d3=dot(rd,oa), d4=dot(ba,oa);
  float den = d2 - d1*d1; float s = clamp((d1*d3 - d4)/max(den,1e-6), 0., 1.);
  float t = clamp(dot(a + ba*s - ro, rd), 0., tmax); vec3 pr = ro+rd*t; s = clamp(dot(pr-a,ba)/d2,0.,1.);
  return length(pr - (a+ba*s)); }
vec3 sparks(vec3 ro, vec3 rd, float tmax){
  vec3 acc = vec3(0.);
  if (SPARK < 0.01) return acc;
  for (int k=ZERO;k<2;k++){ float sx = k==0?-1.:1.; vec3 C = k==0?C1():C2();
    for (int i=ZERO;i<22;i++){ float fi=float(i)+float(k)*41. + floor(uFocus*7.);
      vec3 dir = normalize(vec3(-sx*(0.25+0.6*hash(fi+5.)), -0.5 + 1.1*hash(fi+9.), 0.3+0.9*hash(fi+2.)));
      float st = 0.02 + hash(fi+3.)*0.5, len = 0.05 + hash(fi+4.)*0.2;
      vec3 a = C + dir*st, b = C + dir*(st+len); a.y -= 0.25*st*st; b.y -= 0.25*(st+len)*(st+len);
      float d = segDist(ro, rd, tmax, a, b); float w = (1. - st*1.4)*SPARK;
      acc += (vec3(1.,0.45,0.1)*exp(-d*d/0.00025)*0.8 + vec3(1.,0.9,0.65)*exp(-d*d/0.000018)*3.)*w; }
    float d = segDist(ro, rd, tmax, C, C+vec3(0.,0.001,0.));
    acc += (vec3(1.,0.5,0.12)*exp(-d*d/0.01)*0.7 + vec3(1.,0.92,0.75)*exp(-d*d/0.0006)*3.)*SPARK; }
  return acc;
}
vec3 sky(vec3 d){ vec3 s = mix(vec3(0.62,0.72,0.86), vec3(0.28,0.45,0.78), clamp(d.y*1.5,0.,1.)); return s*0.9; }

void main(){
  gs = uint(gl_FragCoord.x)*1973u + uint(gl_FragCoord.y)*9277u + uSeed*26699u + 1u; rnd(); rnd();
  vec2 fc = gl_FragCoord.xy + vec2(rnd(), rnd()) - 0.5;
  vec2 uv = (2.*fc - uRes)/uRes.y;
  vec3 ww = normalize(uCamTgt - uCamPos), uu = normalize(cross(ww, vec3(0,1,0))), vv = cross(uu, ww);
  float fl = 1./tan(radians(uFov)*0.5);
  vec3 rd0 = normalize(uv.x*uu + uv.y*vv + fl*ww);
  vec3 fp = uCamPos + rd0 * (uFocus / dot(rd0, ww));
  float lr = uAper*sqrt(rnd()), la = 6.2831853*rnd();
  vec3 ro = uCamPos + (uu*cos(la) + vv*sin(la))*lr;
  vec3 rd = normalize(fp - ro);
  vec3 col = vec3(0.), thr = vec3(1.); float tFirst = 900.; oN = vec4(0.,0.,0.,900.); oA = vec4(1.);
  for (int b=ZERO; b<2; b++){
    vec2 h; float t = march(ro, rd, b==0 ? 900. : 10., h);
    if (b==0) tFirst = t < 0. ? 900. : t;
    if (t < 0.) { col += thr*(b==0 ? sky(rd) : sky(rd)*0.6 + SKYC); break; }
    vec3 p = ro + rd*t, n = normal(p, t), v = -rd;
    Mat M = getMat(h.y, p, n);
    if (b==0){ oN = vec4(n, t); oA = vec4(dot(M.emit,vec3(1.)) > 0. ? vec3(1.) : M.c, 1.); }
    if (dot(M.emit, vec3(1.)) > 0.) { col += thr*M.emit*(b==0 ? 1. : 0.15); break; }
    col += thr*direct(p, n, v, M) * (b==0 ? 1. : 1. - M.metal*0.5);
    if (b==0 && t > 30.) col = mix(col, sky(rd)*0.9, 1. - exp(-(t - 30.)*0.004));   // aerial haze on far shots
    if (b==1) { col += thr*M.c*SKYC*0.5; break; }
    vec3 F0 = mix(vec3(M.spec), M.c, M.metal);
    vec3 F = F0 + (1.-F0)*pow(1.-max(dot(n,v),0.),5.);
    float pSpec = M.rough < 0.45 ? clamp(max(F.r,max(F.g,F.b))*(1.-M.rough)*1.5 + M.metal*0.6, 0.15, 0.9) : 0.;
    ro = p + n*0.003;
    if (rnd() < pSpec){ vec3 rr = reflect(rd, n); rd = normalize(rr + (vec3(rnd(),rnd(),rnd())-0.5)*M.rough*M.rough*1.5); thr *= F*(1.-M.rough)/pSpec; }
    else { rd = cosHemi(n); thr *= M.c*(1.-M.metal)*(M.sss > 0. ? vec3(1.05,0.95,0.9) : vec3(1.))/(1.-pSpec); }
  }
  col += sparks(uCamPos, rd0, tFirst);
  o = vec4(col, 1.);
}`;
