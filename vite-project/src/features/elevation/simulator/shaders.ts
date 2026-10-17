/**
 * WGSL for the route simulator. All main-pass shaders share `COMMON`:
 * the frame uniform, the sun shadow map, the sky-view LUT, noise, fog and
 * lighting helpers.
 */

/** 3 mat4 + 8 vec4 = 320 bytes. Keep in sync with Renderer.writeFrame. */
const FRAME_STRUCT = /* wgsl */ `
struct Frame {
  viewProj: mat4x4f,
  lightViewProj: mat4x4f,
  invViewProj: mat4x4f,
  camPos: vec4f,        // xyz, w = time (s)
  sunDir: vec4f,        // xyz toward the sun
  sunColor: vec4f,      // rgb direct irradiance
  skyAmbient: vec4f,
  groundAmbient: vec4f,
  fog: vec4f,           // x density, y height falloff, z exposure, w route length
  shadow: vec4f,        // x texel size, y depth bias, z normal offset, w road half width
  extra: vec4f,         // x road shoulder width
};
@group(0) @binding(0) var<uniform> frame: Frame;
`;

const COMMON = /* wgsl */ `
${FRAME_STRUCT}
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var skyLut: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;

const PI = 3.14159265;

fn hash(p: vec2<i32>) -> f32 {
  var h = bitcast<u32>(p.x) * 374761393u + bitcast<u32>(p.y) * 668265263u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  h = h ^ (h >> 16u);
  return f32(h) / 4294967295.0;
}

fn vnoise(p: vec2f) -> f32 {
  let i = vec2<i32>(floor(p));
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash(i);
  let b = hash(i + vec2<i32>(1, 0));
  let c = hash(i + vec2<i32>(0, 1));
  let d = hash(i + vec2<i32>(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var s = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) {
    s += vnoise(p) * a;
    p = mat2x2f(1.6, -1.2, 1.2, 1.6) * p;
    a *= 0.5;
  }
  return s / 0.9375;
}

fn skyUv(dir: vec3f) -> vec2f {
  let el = asin(clamp(dir.y, 0.0, 1.0));
  let az = atan2(dir.z, dir.x);
  return vec2f(az / (2.0 * PI) + 0.5, sqrt(el / (0.5 * PI)));
}

fn sky(dir: vec3f) -> vec3f {
  return textureSampleLevel(skyLut, linearSampler, skyUv(dir), 0.0).rgb;
}

fn shadowFactor(worldPos: vec3f, n: vec3f) -> f32 {
  let p = frame.lightViewProj * vec4f(worldPos + n * frame.shadow.z, 1.0);
  let ndc = p.xyz / p.w;
  let uv = vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
  let inside = all(uv > vec2f(0.0)) && all(uv < vec2f(1.0)) && ndc.z < 1.0;
  var s = 0.0;
  let t = frame.shadow.x;
  // 4x4 PCF on a rotated grid.
  for (var y = 0; y < 4; y++) {
    for (var x = 0; x < 4; x++) {
      let o = (vec2f(f32(x), f32(y)) - 1.5) * t;
      s += textureSampleCompareLevel(shadowMap, shadowSampler, uv + o, ndc.z - frame.shadow.y);
    }
  }
  // Fade out toward the edge of the shadow box instead of popping.
  let edge = max(abs(ndc.x), abs(ndc.y));
  let fade = smoothstep(0.85, 1.0, edge);
  return select(1.0, mix(s / 16.0, 1.0, fade), inside) * cloudShadow(worldPos);
}

fn applyFog(color: vec3f, worldPos: vec3f) -> vec3f {
  let v = worldPos - frame.camPos.xyz;
  let dist = length(v);
  let dir = v / max(dist, 1e-3);
  let fall = frame.fog.y;
  let h0 = max(frame.camPos.y, 0.0);
  let dh = v.y * fall;
  var heightTerm = 1.0;
  if (abs(dh) > 1e-4) { heightTerm = (1.0 - exp(-dh)) / dh; }
  let amount = frame.fog.x * exp(-h0 * fall) * dist * heightTerm;
  let trans = exp(-max(amount, 0.0));
  let mu = max(dot(dir, frame.sunDir.xyz), 0.0);
  let inscatter = sky(normalize(vec3f(dir.x, 0.03, dir.z))) * 0.9
    + frame.sunColor.rgb * (0.02 * pow(mu, 8.0) + 0.04 * pow(mu, 48.0));
  return mix(inscatter, color, trans);
}

// Fair-weather cumulus on a single layer, drifting with the wind.
const CLOUD_HEIGHT = 1800.0;
fn cloudDensity(xz: vec2f) -> f32 {
  let t = frame.camPos.w;
  let p = (xz + vec2f(t * 9.0, t * 4.0)) / 2600.0;
  let base = fbm(p);
  let detail = vnoise(p * 9.0 + vec2f(t * 0.004));
  return smoothstep(0.52, 0.78, base + detail * 0.12);
}

/** Sunlight left after passing the cloud layer above a point. */
fn cloudShadow(world: vec3f) -> f32 {
  let L = frame.sunDir.xyz;
  if (L.y < 0.02) { return 1.0; }
  let hit = world.xz + L.xz * ((CLOUD_HEIGHT - world.y) / L.y);
  return 1.0 - 0.75 * cloudDensity(hit);
}

fn ambient(n: vec3f) -> vec3f {
  return mix(frame.groundAmbient.rgb, frame.skyAmbient.rgb, n.y * 0.5 + 0.5);
}
`;

// ---------------------------------------------------------------------------
// Sky-view LUT: single-scattering atmosphere, rendered once per sun change.
// ---------------------------------------------------------------------------

export const SKY_LUT_WGSL = /* wgsl */ `
${FRAME_STRUCT}
const PI = 3.14159265;
const R_PLANET = 6371e3;
const R_ATMOS = 6471e3;
const K_RLH = vec3f(5.5e-6, 13.0e-6, 22.4e-6);
const K_MIE = 21e-6;
const SH_RLH = 8e3;
const SH_MIE = 1.2e3;
const G = 0.758;
const I_SUN = 22.0;

fn raySphere(r0: vec3f, rd: vec3f, sr: f32) -> vec2f {
  let b = 2.0 * dot(rd, r0);
  let c = dot(r0, r0) - sr * sr;
  let d = b * b - 4.0 * c;
  if (d < 0.0) { return vec2f(1e5, -1e5); }
  return vec2f((-b - sqrt(d)) / 2.0, (-b + sqrt(d)) / 2.0);
}

fn atmosphere(rd: vec3f, sun: vec3f) -> vec3f {
  let r0 = vec3f(0.0, R_PLANET + 1000.0, 0.0);
  var p = raySphere(r0, rd, R_ATMOS);
  let steps = 24;
  let ds = p.y / f32(steps);
  let mu = dot(rd, sun);
  let pR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  let pM = 3.0 / (8.0 * PI) * ((1.0 - G * G) * (1.0 + mu * mu)) /
    ((2.0 + G * G) * pow(1.0 + G * G - 2.0 * mu * G, 1.5));
  var totR = vec3f(0.0);
  var totM = vec3f(0.0);
  var odR = 0.0;
  var odM = 0.0;
  for (var i = 0; i < steps; i++) {
    let pos = r0 + rd * (f32(i) + 0.5) * ds;
    let h = length(pos) - R_PLANET;
    let hr = exp(-h / SH_RLH) * ds;
    let hm = exp(-h / SH_MIE) * ds;
    odR += hr;
    odM += hm;
    let ls = raySphere(pos, sun, R_ATMOS).y;
    let lsteps = 8;
    let lds = ls / f32(lsteps);
    var lR = 0.0;
    var lM = 0.0;
    var blocked = false;
    for (var j = 0; j < lsteps; j++) {
      let lp = pos + sun * (f32(j) + 0.5) * lds;
      let lh = length(lp) - R_PLANET;
      if (lh < 0.0) { blocked = true; break; }
      lR += exp(-lh / SH_RLH) * lds;
      lM += exp(-lh / SH_MIE) * lds;
    }
    if (!blocked) {
      let att = exp(-(K_MIE * (odM + lM) + K_RLH * (odR + lR)));
      totR += hr * att;
      totM += hm * att;
    }
  }
  return I_SUN * (pR * K_RLH * totR + pM * K_MIE * totM);
}

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[i], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) frag: vec4f) -> @location(0) vec4f {
  let dims = vec2f(256.0, 128.0);
  let uv = frag.xy / dims;
  let az = (uv.x - 0.5) * 2.0 * PI;
  let el = uv.y * uv.y * 0.5 * PI;
  let rd = vec3f(cos(el) * cos(az), sin(el), cos(el) * sin(az));
  return vec4f(atmosphere(rd, frame.sunDir.xyz), 1.0);
}
`;

// ---------------------------------------------------------------------------
// Sky dome (fullscreen) with sun disc.
// ---------------------------------------------------------------------------

export const SKY_WGSL = /* wgsl */ `
${COMMON}
struct VOut { @builtin(position) pos: vec4f, @location(0) ndc: vec2f };

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  let p = array(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.ndc = p[i];
  return o;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let w = frame.invViewProj * vec4f(in.ndc, 1.0, 1.0);
  let dir = normalize(w.xyz / w.w - frame.camPos.xyz);
  var col = sky(dir);
  // Below the horizon: hazy ground glow fading into the lower atmosphere.
  if (dir.y < 0.0) {
    let haze = sky(normalize(vec3f(dir.x, 0.0, dir.z)));
    col = mix(haze, haze * 0.55 + frame.groundAmbient.rgb * 0.3, smoothstep(0.0, -0.25, dir.y));
  }
  let mu = dot(dir, frame.sunDir.xyz);
  let sunR = 0.00465 * 1.6;
  var cloudCover = 0.0;
  var cloudCol = vec3f(0.0);
  if (dir.y > 0.005 && frame.camPos.y < CLOUD_HEIGHT) {
    let dist = (CLOUD_HEIGHT - frame.camPos.y) / dir.y;
    let p = frame.camPos.xz + dir.xz * dist;
    let d = cloudDensity(p);
    if (d > 0.0) {
      // Self-shadowing: how much cloud lies between this point and the sun.
      let L = frame.sunDir.xyz;
      let toward = cloudDensity(p + normalize(L.xz + vec2f(1e-4)) * 350.0);
      let lit = mix(1.0, 0.35, toward) * (0.6 + 0.4 * d);
      // Strong forward scattering lines cloud edges with light near the sun.
      let silver = pow(max(mu, 0.0), 12.0) * (1.0 - d) * 2.0;
      let base = frame.sunColor.rgb * (lit * 0.28 + silver) + frame.skyAmbient.rgb * (1.25 - 0.45 * d);
      let fade = exp(-dist / 32000.0) * smoothstep(0.005, 0.06, dir.y);
      cloudCover = d * fade;
      cloudCol = base;
    }
  }
  col = mix(col, cloudCol, cloudCover);
  let cosR = cos(sunR);
  if (mu > cosR && dir.y > -0.01) {
    let r = acos(clamp(mu, -1.0, 1.0)) / sunR;
    let limb = pow(max(1.0 - r * r, 0.0), 0.4);
    col += frame.sunColor.rgb * 60.0 * limb * (1.0 - cloudCover);
  }
  // Soft bloom halo around the sun.
  col += frame.sunColor.rgb * 0.05 * pow(max(mu, 0.0), 300.0);
  return vec4f(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

export const TERRAIN_WGSL = /* wgsl */ `
${COMMON}
struct VIn {
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
  @location(2) routeDist: f32,
};
struct VOut {
  @builtin(position) clip: vec4f,
  @location(0) world: vec3f,
  @location(1) normal: vec3f,
  @location(2) routeDist: f32,
};

@vertex
fn vs(in: VIn) -> VOut {
  var o: VOut;
  o.clip = frame.viewProj * vec4f(in.pos, 1.0);
  o.world = in.pos;
  o.normal = in.normal;
  o.routeDist = in.routeDist;
  return o;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let p = in.world.xz;
  let dist = distance(in.world, frame.camPos.xyz);
  let ng = normalize(in.normal);
  let slope = 1.0 - ng.y;

  // Micro relief: tilt the normal by a noise gradient, faded with distance
  // so it never shimmers far away.
  let detail = 1.0 - smoothstep(30.0, 600.0, dist);
  let e = 0.6;
  let s = 0.35;
  let h0 = fbm(p * s);
  let hx = fbm((p + vec2f(e, 0.0)) * s);
  let hz = fbm((p + vec2f(0.0, e)) * s);
  let n = normalize(ng + vec3f(h0 - hx, 0.0, h0 - hz) * 2.2 * detail);

  // Albedo: meadow grass with dry patches, rock on steep ground.
  let large = fbm(p * 0.004);
  let medium = fbm(p * 0.03);
  var grass = mix(vec3f(0.045, 0.075, 0.022), vec3f(0.1, 0.12, 0.04), medium);
  grass = mix(grass, vec3f(0.16, 0.14, 0.07), smoothstep(0.55, 0.75, large) * 0.6);
  let fine = mix(1.0, 0.75 + 0.5 * vnoise(p * 1.7), detail);
  grass *= fine;
  let rockN = vnoise(p * 0.25);
  let rock = vec3f(0.27, 0.25, 0.23) * (0.7 + 0.5 * rockN);
  let rockW = smoothstep(0.3, 0.48, slope + (medium - 0.5) * 0.15);
  var albedo = mix(grass, rock, rockW);

  // Trampled earth right next to the road where the mesh is fine enough.
  let edge = frame.shadow.w + frame.extra.x;
  albedo = mix(vec3f(0.2, 0.17, 0.13) * fine, albedo, smoothstep(edge, edge + 3.0, in.routeDist));

  let L = frame.sunDir.xyz;
  let ndl = max(dot(n, L), 0.0);
  let sh = shadowFactor(in.world, ng);
  // Grass back-scatters a little light (cheap retroreflection).
  let V = normalize(frame.camPos.xyz - in.world);
  let back = pow(max(dot(V, L), 0.0), 4.0) * 0.25 * (1.0 - rockW);
  var col = albedo * (frame.sunColor.rgb * (ndl + back * ndl) * sh + ambient(n));
  col = applyFog(col, in.world);
  return vec4f(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Road ribbon
// ---------------------------------------------------------------------------

export const ROAD_WGSL = /* wgsl */ `
${COMMON}
struct VIn {
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};
struct VOut {
  @builtin(position) clip: vec4f,
  @location(0) world: vec3f,
  @location(1) uv: vec2f,
};

@vertex
fn vs(in: VIn) -> VOut {
  var o: VOut;
  o.clip = frame.viewProj * vec4f(in.pos, 1.0);
  o.world = in.pos;
  o.uv = in.uv;
  return o;
}

fn band(x: f32, center: f32, halfW: f32) -> f32 {
  let fw = fwidth(x) + 1e-4;
  return 1.0 - smoothstep(halfW - fw, halfW + fw, abs(x - center));
}

@fragment
fn fs(in: VOut) -> @location(0) vec4f {
  let half = frame.shadow.w;
  let total = half + frame.extra.x;
  let x = in.uv.x * total;
  let v = in.uv.y;
  let p = in.world.xz;
  let dist = distance(in.world, frame.camPos.xyz);
  let detail = 1.0 - smoothstep(20.0, 300.0, dist);

  // Asphalt: fine aggregate, tar patches, darker wheel tracks.
  let grain = mix(1.0, 0.8 + 0.4 * vnoise(p * 9.0), detail);
  let patches = 0.85 + 0.3 * fbm(p * 0.08);
  let tracks = 1.0 - 0.12 * (band(abs(x), half * 0.5, 0.45));
  var albedo = vec3f(0.06, 0.06, 0.065) * grain * patches * tracks;

  // Paint: edge lines, dashed centre line, start line, chequered finish.
  let paint = vec3f(0.62, 0.62, 0.6);
  let edgeL = band(abs(x), half - 0.3, 0.06);
  let dash = band(x, 0.0, 0.06) * step(fract(v / 9.0), 0.45);
  let start = band(v, 1.0, 0.3) * step(abs(x), half);
  let L = frame.fog.w;
  let fin = step(L - 3.0, v) * step(v, L - 1.0) * step(abs(x), half);
  let cheq = f32((i32(floor(x * 2.0)) + i32(floor(v * 2.0))) % 2 == 0);
  let line = max(max(edgeL, dash), start);
  albedo = mix(albedo, paint * (0.9 + 0.1 * grain), line * 0.9);
  albedo = mix(albedo, mix(vec3f(0.03), paint, cheq), fin);

  // Gravel shoulder.
  let shoulder = smoothstep(half - 0.05, half + 0.05, abs(x));
  let gravel = vec3f(0.13, 0.12, 0.1) * (0.7 + 0.6 * vnoise(p * 6.0));
  albedo = mix(albedo, gravel, shoulder);

  let n = vec3f(0.0, 1.0, 0.0);
  let Ldir = frame.sunDir.xyz;
  let V = normalize(frame.camPos.xyz - in.world);
  let H = normalize(Ldir + V);
  let sh = shadowFactor(in.world, n);
  let ndl = max(dot(n, Ldir), 0.0);
  // Dull sheen on the asphalt, strongest into a low sun.
  let fres = pow(1.0 - max(dot(n, V), 0.0), 5.0);
  let spec = pow(max(dot(n, H), 0.0), 60.0) * (0.05 + 0.3 * fres) * (1.0 - shoulder);
  var col = albedo * (frame.sunColor.rgb * ndl * sh + ambient(n)) + frame.sunColor.rgb * spec * sh;
  col += sky(reflect(-V, n)) * fres * 0.06 * (1.0 - shoulder);
  col = applyFog(col, in.world);
  return vec4f(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Instanced meshes: trees, runner, markers.
// ---------------------------------------------------------------------------

const MESH_VERTEX = /* wgsl */ `
struct VIn {
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) m0: vec4f,
  @location(4) m1: vec4f,
  @location(5) m2: vec4f,
  @location(6) m3: vec4f,
  @location(7) tint: vec4f,
};

fn swayed(in: VIn) -> vec3f {
  var p = in.pos;
  if (in.tint.a > 0.5 && in.tint.a < 1.5) {
    // Foliage: wind sway grows with height; per-tree phase from position.
    let ph = in.m3.x * 0.13 + in.m3.z * 0.07;
    let t = frame.camPos.w;
    let gust = 0.6 + 0.4 * sin(t * 0.35 + ph * 0.2);
    let k = p.y * p.y * gust;
    p.x += sin(t * 1.4 + ph) * 0.018 * k;
    p.z += cos(t * 1.1 + ph * 1.3) * 0.012 * k;
  }
  return p;
}

fn modelOf(in: VIn) -> mat4x4f {
  return mat4x4f(in.m0, in.m1, in.m2, in.m3);
}
`;

export const MESH_WGSL = /* wgsl */ `
${COMMON}
${MESH_VERTEX}
struct VOut {
  @builtin(position) clip: vec4f,
  @location(0) world: vec3f,
  @location(1) normal: vec3f,
  @location(2) color: vec3f,
  @location(3) @interpolate(flat) material: f32,
  @location(4) local: vec3f,
};

@vertex
fn vs(in: VIn) -> VOut {
  let m = modelOf(in);
  let world = m * vec4f(swayed(in), 1.0);
  // Inverse-transpose for rotation * scale with orthogonal axes.
  let c0 = in.m0.xyz;
  let c1 = in.m1.xyz;
  let c2 = in.m2.xyz;
  let nrm = c0 * (in.normal.x / dot(c0, c0)) + c1 * (in.normal.y / dot(c1, c1)) + c2 * (in.normal.z / dot(c2, c2));
  var o: VOut;
  o.clip = frame.viewProj * world;
  o.world = world.xyz;
  o.normal = normalize(nrm);
  o.color = in.color * in.tint.rgb;
  o.material = in.tint.a;
  o.local = in.pos;
  return o;
}

@fragment
fn fs(in: VOut, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  var n = normalize(in.normal);
  if (!front) { n = -n; }
  let L = frame.sunDir.xyz;
  let V = normalize(frame.camPos.xyz - in.world);
  let sh = shadowFactor(in.world, n);
  var col: vec3f;
  if (in.material > 0.5 && in.material < 1.5) {
    // Foliage: wrapped diffuse plus light leaking through the leaves.
    let leaf = 0.75 + 0.5 * vnoise(in.local.xz * 23.0 + in.local.y * 17.0);
    let wrap = max((dot(n, L) + 0.45) / 1.45, 0.0);
    let trans = pow(max(dot(-V, L), 0.0), 3.0) * 0.35;
    col = in.color * leaf * (frame.sunColor.rgb * (wrap + trans) * sh + ambient(n) * 1.1);
  } else {
    let runner = in.material > 1.5;
    // Runner: wrapped diffuse and a warm shadow tint stand in for light
    // scattering under skin and through fabric, so the shaded side isn't
    // the flat blue-grey of pure skylight. Props stay plain Lambert.
    let wrapK = select(0.0, 0.35, runner);
    let ndl = max((dot(n, L) + wrapK) / (1.0 + wrapK), 0.0);
    let sss = select(vec3f(1.0), vec3f(1.25, 0.95, 0.8), runner);
    let H = normalize(L + V);
    let gloss = select(0.04, 0.12, runner);
    let spec = pow(max(dot(n, H), 0.0), 24.0) * gloss;
    col = in.color * (frame.sunColor.rgb * ndl * sh + ambient(n) * sss)
      + frame.sunColor.rgb * spec * sh;
  }
  col = applyFog(col, in.world);
  return vec4f(col, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Shadow pass (depth only, from the sun).
// ---------------------------------------------------------------------------

export const SHADOW_WGSL = /* wgsl */ `
${FRAME_STRUCT}
${MESH_VERTEX}

@vertex
fn vsMesh(in: VIn) -> @builtin(position) vec4f {
  return frame.lightViewProj * (modelOf(in) * vec4f(swayed(in), 1.0));
}

@vertex
fn vsTerrain(@location(0) pos: vec3f) -> @builtin(position) vec4f {
  return frame.lightViewProj * vec4f(pos, 1.0);
}
`;

// ---------------------------------------------------------------------------
// Post: exposure, ACES filmic tone map, vignette, grain, gamma.
// ---------------------------------------------------------------------------

export const POST_WGSL = /* wgsl */ `
${FRAME_STRUCT}
@group(0) @binding(1) var hdr: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = array(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[i], 0.0, 1.0);
}

fn aces(x: vec3f) -> vec3f {
  let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}

@fragment
fn fs(@builtin(position) frag: vec4f) -> @location(0) vec4f {
  let dims = vec2f(textureDimensions(hdr));
  var col = textureLoad(hdr, vec2<i32>(frag.xy), 0).rgb * frame.fog.z;
  col = aces(col);
  let uv = frag.xy / dims;
  let vig = 1.0 - 0.35 * pow(length((uv - 0.5) * vec2f(1.0, 0.8)), 2.2);
  col *= vig;
  col = pow(col, vec3f(1.0 / 2.2));
  // Tiny ordered grain hides 8-bit banding in the sky gradient.
  let g = fract(sin(dot(frag.xy, vec2f(12.9898, 78.233))) * 43758.5453) - 0.5;
  col += g / 255.0;
  return vec4f(col, 1.0);
}
`;
