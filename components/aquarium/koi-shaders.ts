import { BONE_COUNT, MAX_WAVE_IMPULSES, POND } from "./koi-config";

/**
 * ---------------------------------------------------------------------------
 * GLSL for the crimson pond
 * ---------------------------------------------------------------------------
 * The pipeline has five stages:
 *
 *   1. Scene FBO  — the Figma-red water, warm caustics and a dim pebble bed.
 *   2. Title      — the KYOKO lettering, drawn flat on the pond floor at the
 *                   same rectangle as the accessible <h1>.
 *   3. Koi        — soft shadows, then the 20-bone skinned fish, far to near.
 *   4. Composite  — decode the 16-bit heightfield with manual bilinear
 *                   filtering, refract the scene with a little chromatic
 *                   dispersion, then add the warm specular along a crest.
 *   5. Overlay    — the optional live rig: one point per bone, one line per
 *                   segment, drawn straight into the final canvas.
 *
 * The palette is sampled from the current Figma frame: #900606 at the top,
 * #5e0404 through the middle and a near-black #120000 at the floor.
 */

const HEIGHT_RANGE = (POND.wave.heightRange * 2).toFixed(1);
const REFRACTION_GAIN = POND.render.refractionGain.toFixed(1);
const PARALLAX_BED = POND.render.parallaxBed.toFixed(2);

export const fishVertexShader = `#version 300 es
precision highp float;
#define BONES ${BONE_COUNT}

layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUv;
layout(location = 2) in vec4 aBone;
layout(location = 3) in vec4 aWeight;

uniform vec2 uBonePos[BONES];
uniform float uBoneAngle[BONES];
uniform vec2 uRestPos[BONES];
uniform float uRestAngle[BONES];
uniform float uWorldScale;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uParallax;
uniform float uSurfaceScale;
uniform float uGulpAmount;

out vec2 vUv;
out vec2 vWorld;

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

void main() {
  vec2 world = vec2(0.0);
  float surfaceScale = uSurfaceScale > 0.0 ? uSurfaceScale : 1.0;
  for (int k = 0; k < 4; k++) {
    int bone = int(aBone[k] + 0.5);
    float weight = aWeight[k];
    float headMask = 1.0 - smoothstep(0.5, 4.2, float(bone));
    float localScale = uWorldScale * surfaceScale * (1.0 + uGulpAmount * 0.14 * headMask);
    vec2 relative = (aPos - uRestPos[bone]) * localScale;
    world += weight * (
      uBonePos[bone] +
      rotate2D(relative, uBoneAngle[bone] - uRestAngle[bone])
    );
  }
  world += uOffset;
  world.y += uParallax;

  vUv = aUv;
  vWorld = world;
  vec2 ndc = vec2(
    world.x / uResolution.x * 2.0 - 1.0,
    1.0 - world.y / uResolution.y * 2.0
  );
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

export const fishFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
in vec2 vWorld;

uniform sampler2D uTexture;
uniform vec2 uTexel;
uniform float uAlpha;
uniform float uDepth;
uniform float uTime;
uniform float uShadow;
uniform float uShadowStrength;
uniform vec3 uTint;
uniform float uGlow;

out vec4 outColor;

void main() {
  if (uShadow > 0.5) {
    // Nine taps on the alpha edge make a soft cast shadow without a blur pass.
    float soft = 0.0;
    soft += texture(uTexture, vUv).a * 2.0;
    soft += texture(uTexture, vUv + vec2(uTexel.x, 0.0) * 2.4).a;
    soft += texture(uTexture, vUv - vec2(uTexel.x, 0.0) * 2.4).a;
    soft += texture(uTexture, vUv + vec2(0.0, uTexel.y) * 2.4).a;
    soft += texture(uTexture, vUv - vec2(0.0, uTexel.y) * 2.4).a;
    soft += texture(uTexture, vUv + uTexel * 1.9).a;
    soft += texture(uTexture, vUv - uTexel * 1.9).a;
    soft += texture(uTexture, vUv + vec2(uTexel.x, -uTexel.y) * 1.9).a;
    soft += texture(uTexture, vUv + vec2(-uTexel.x, uTexel.y) * 1.9).a;
    soft /= 10.0;

    float shadowAlpha =
      smoothstep(0.035, 0.62, soft) * uShadowStrength * uAlpha;
    outColor = vec4(vec3(0.012, 0.0, 0.0) * shadowAlpha, shadowAlpha);
    return;
  }

  vec4 texel = texture(uTexture, vUv);
  float alpha = texel.a;
  if (alpha < 0.004) discard;

  vec3 color = texel.rgb / max(alpha, 1e-4);

  // The far koi sit deeper in the crimson water.
  float haze = (1.0 - uDepth) * 0.28;
  color = mix(color, vec3(0.30, 0.032, 0.028), haze);
  color *= mix(0.74, 1.04, uDepth);

  // Warm caustic light crawls over the body while it swims.
  float waveA = sin(
    vWorld.x * 0.032 + uTime * 0.55 +
    sin(vWorld.y * 0.025 - uTime * 0.4) * 2.0
  );
  float waveB = sin(
    vWorld.y * 0.041 - uTime * 0.7 +
    sin(vWorld.x * 0.017 + uTime * 0.25) * 2.3
  );
  float caustic = pow(clamp(0.5 + 0.24 * (waveA + waveB), 0.0, 1.0), 3.2);
  color += caustic * vec3(0.44, 0.25, 0.10) * (0.14 + 0.18 * uDepth);

  // Species tint. Every species reuses the authored rig and texture; only the
  // body colour multiplier and the optional emissive rim change.
  color *= uTint;
  if (uGlow > 0.001) {
    float rim = pow(2.0 * abs(vUv.x - 0.5), 2.0);
    color += uGlow * vec3(0.34, 0.72, 0.8) * (0.35 + caustic * 1.4);
    color += uGlow * vec3(0.2, 0.5, 0.55) * rim * 0.7;
  }

  float outAlpha = alpha * uAlpha;
  outColor = vec4(color * outAlpha, outAlpha);
}
`;

export const titleVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPos;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;

void main() {
  vUv = aPos * 0.5 + 0.5;
  vec2 world = uRect.xy + vUv * uRect.zw;
  vec2 ndc = vec2(
    world.x / uResolution.x * 2.0 - 1.0,
    1.0 - world.y / uResolution.y * 2.0
  );
  gl_Position = vec4(ndc, 0.0, 1.0);
}
`;

export const titleFragmentShader = `#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D uTexture;
uniform float uOpacity;
out vec4 outColor;

void main() {
  vec4 texel = texture(uTexture, vUv);
  // The upload is premultiplied, so this stays correct through mip levels.
  outColor = texel * uOpacity;
  // A whisper of warm light keeps the brown lettering legible in the water.
  outColor.rgb *= vec3(1.0, 0.982, 0.955);
}
`;

export const backgroundVertexShader = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const backgroundFragmentShader = `#version 300 es
precision highp float;
#define PARALLAX_BED ${PARALLAX_BED}

in vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;
uniform vec3 u_waterRgb;
uniform float u_waterCustomMix;
uniform float u_nightFactor;
uniform vec3 u_lightColor;
uniform float u_lightIntensity;
uniform float u_lightKind;
out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 23.34);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 7.31));
}

/**
 * The frame's radial crimson. Bright at the top edge, a softer centre bloom,
 * and a black floor wash so the cream field-note copy can sit on it.
 */
vec3 waterBase(vec2 uv) {
  float y = clamp(uv.y, 0.0, 1.0);
  vec3 color = mix(
    vec3(0.585, 0.030, 0.027),
    vec3(0.360, 0.014, 0.012),
    smoothstep(0.0, 0.56, y)
  );
  color = mix(
    color,
    vec3(0.225, 0.006, 0.005),
    smoothstep(0.55, 0.84, y)
  );
  color = mix(
    color,
    vec3(0.022, 0.0, 0.0),
    smoothstep(0.84, 1.0, y)
  );

  vec2 bloomOffset = uv - vec2(0.5, 0.43);
  float bloom = exp(-dot(bloomOffset, bloomOffset) * 6.4);
  color += vec3(0.105, 0.006, 0.004) * bloom;
  color += vec3(0.055, 0.004, 0.003) * (1.0 - smoothstep(0.0, 0.2, y));

  float middle = smoothstep(0.04, 0.28, y) * (1.0 - smoothstep(0.82, 0.98, y));
  float edge = smoothstep(0.22, 0.0, uv.x) + smoothstep(0.78, 1.0, uv.x);
  color *= 1.0 - edge * 0.16 * middle;

  return color;
}

/**
 * Three interfering sine trains make thin, moving light webs. This is cheaper
 * than a Voronoi caustic and, at this darkness, reads the same.
 */
float causticLayer(vec2 p, float t, float scale) {
  vec2 q = p * scale;
  float a = sin(q.x * 1.70 + sin(q.y * 1.25 + t * 0.40) * 2.10 + t * 0.65);
  float b = sin(q.y * 2.05 + sin(q.x * 1.75 - t * 0.32) * 2.35 - t * 0.50);
  float c = sin(
    (q.x + q.y) * 1.15 +
    sin((q.x - q.y) * 0.90 + t * 0.22) * 1.60 +
    t * 0.30
  );
  float ridge = 1.0 - abs(a + b + c) * 0.26;
  return pow(clamp(ridge, 0.0, 1.0), 5.0);
}

vec3 pebbleField(vec2 p, float caustic) {
  vec2 q = p / vec2(78.0, 50.0);
  q.x += 0.055 * sin(p.y * 0.012);

  vec2 cell = floor(q);
  vec2 local = fract(q);
  float nearest = 8.0;
  float second = 8.0;
  float id = 0.0;
  vec2 toNearest = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 grid = vec2(float(x), float(y));
      vec2 offset = hash22(cell + grid);
      vec2 delta = grid + (0.14 + 0.72 * offset) - local;
      float distance = dot(delta, delta);
      if (distance < nearest) {
        second = nearest;
        nearest = distance;
        id = hash21(cell + grid + 3.7);
        toNearest = delta;
      } else if (distance < second) {
        second = distance;
      }
    }
  }

  float edge = sqrt(second) - sqrt(nearest);
  float body = smoothstep(0.012, 0.14, edge);
  float shade = dot(
    normalize(toNearest + vec2(1e-4)),
    normalize(vec2(-0.55, -0.84))
  );

  vec3 stone = mix(vec3(0.10, 0.030, 0.020), vec3(0.54, 0.25, 0.13), id);
  stone = mix(stone, vec3(0.32, 0.15, 0.09), 0.34);
  stone *= 0.68 + 0.34 * shade;
  stone *= 0.82 + 0.55 * caustic;
  stone = mix(vec3(0.09, 0.012, 0.008), stone, 0.15 + 0.85 * body);
  return stone;
}

void main() {
  // Top-left UV so the shader and the CSS composition share an origin.
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  // The bed and the light webs trail the page as it scrolls, so the water
  // reads as a volume rather than a flat backdrop.
  vec2 p = uv * uResolution + vec2(0.0, -uScroll * PARALLAX_BED);
  float y = uv.y;
  float time = uTime;

  vec3 color = waterBase(uv);
  float depthMask = smoothstep(0.04, 0.30, y) * (1.0 - smoothstep(0.72, 0.96, y));
  float causticA = causticLayer(p + vec2(time * 7.5, -time * 4.2), time, 0.0115);
  float causticB = causticLayer(p * 1.19 + vec2(41.0, 87.0) + vec2(-time * 9.0, time * 5.0), time * 1.21, 0.019);
  float caustic = (causticA * 0.60 + causticB * 0.50) * depthMask;
  color += vec3(0.62, 0.30, 0.11) * caustic * 0.15;

  // A dim river-bed of stones rises through the lower quarter.
  float bed = smoothstep(0.62, 0.90, y);
  if (bed > 0.002) {
    vec3 stones = pebbleField(p, causticB);
    color = mix(color, stones, bed * 0.26);
  }

  // Custom basin tint: keep the vertical depth gradient, swap the hue.
  vec2 bloomOffset = uv - vec2(0.5, 0.43);
  float bloom = exp(-dot(bloomOffset, bloomOffset) * 6.4);
  float depthShade = 0.42 + 0.9 * (1.0 - smoothstep(0.0, 0.95, y));
  vec3 custom = u_waterRgb * depthShade;
  custom += u_waterRgb * bloom * 0.8;
  custom += vec3(0.55, 0.3, 0.12) * caustic * 0.08;
  color = mix(color, custom, clamp(u_waterCustomMix, 0.0, 1.0));

  // Night dims the whole basin; light moods are added after the water body.
  color *= mix(1.0, 0.36, clamp(u_nightFactor, 0.0, 1.0));

  int kind = int(u_lightKind + 0.5);
  if (kind == 1) {
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 pool = vec2(
        0.26 + fi * 0.24 + sin(time * 0.24 + fi * 2.1) * 0.035,
        0.42 + cos(time * 0.19 + fi) * 0.05
      );
      float aspect = uResolution.x / max(1.0, uResolution.y);
      vec2 delta = (uv - pool) * vec2(aspect, 1.0);
      float glow = exp(-dot(delta, delta) * 28.0);
      color += u_lightColor * glow * 0.26 * u_lightIntensity;
    }
  } else if (kind == 2) {
    float beam = exp(-abs(uv.x - 0.5 + sin(time * 0.14) * 0.02) * 9.0);
    beam *= 0.7 + 0.3 * sin(uv.x * 31.0 + time * 0.55 + uv.y * 5.0);
    beam *= 1.0 - smoothstep(0.35, 0.9, uv.y);
    color += u_lightColor * beam * (0.18 + caustic * 0.35) * u_lightIntensity;
  } else if (kind == 3) {
    float edge = smoothstep(0.16, 0.0, uv.x) + smoothstep(0.84, 1.0, uv.x);
    float pulse = 0.62 + 0.38 * sin(uv.y * 9.0 - time * 1.3);
    color += u_lightColor * edge * pulse * 0.3 * u_lightIntensity;
    float under = smoothstep(0.7, 0.95, uv.y) * (1.0 - smoothstep(0.95, 1.0, uv.y));
    color += u_lightColor * under * 0.14 * u_lightIntensity;
  } else if (kind == 4) {
    // Sparse colonies of motes rather than a uniform starfield: large masked
    // patches, each with a few drifting points.
    float colony = hash21(floor(p / 190.0) + 4.7);
    float mask = smoothstep(0.28, 0.72, colony) * (0.55 + 0.45 * smoothstep(0.1, 0.85, y));
    vec2 cell = floor(p / 96.0);
    vec2 local = fract(p / 96.0);
    float mote = 0.0;
    for (int yy = -1; yy <= 1; yy++) {
      for (int xx = -1; xx <= 1; xx++) {
        vec2 grid = vec2(float(xx), float(yy));
        vec2 offset = hash22(cell + grid);
        vec2 center = grid + offset;
        center += vec2(
          sin(time * 0.4 + offset.y * 9.0),
          cos(time * 0.33 + offset.x * 8.0)
        ) * 0.2;
        mote += smoothstep(0.11, 0.0, length(local - center));
      }
    }
    mote *= mask * (0.45 + 0.55 * sin(time * 1.2 + cell.x * 1.7 + cell.y));
    color += u_lightColor * mote * 0.42 * u_lightIntensity;
    color += u_lightColor * mask * 0.035 * u_lightIntensity;
  }

  outColor = vec4(color, 1.0);
}
`;

/** Interleaved plant geometry: pos2, uv2, colour3, type1. */
﻿export const plantVertexShader = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_pos;
layout(location = 1) in vec2 a_uv;
layout(location = 2) in vec3 a_color;
layout(location = 3) in float a_type;

uniform vec2 uResolution;

out vec2 v_uv;
out vec2 v_worldPos;
out vec3 v_color;
out float v_type;

void main() {
  v_uv = a_uv;
  v_worldPos = a_pos;
  v_color = a_color;
  v_type = a_type;

  vec2 clip = vec2(
    (a_pos.x / uResolution.x) * 2.0 - 1.0,
    1.0 - (a_pos.y / uResolution.y) * 2.0
  );
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

export const plantFragmentShader = `#version 300 es
precision highp float;

uniform float uTime;

in vec2 v_uv;
in vec2 v_worldPos;
in vec3 v_color;
in float v_type;

out vec4 fragColor;

void main() {
  if (v_type < -0.5) {
    float edgeFade = 1.0;
    if (abs(v_uv.x) > 0.01 || v_uv.y > 0.01) {
      float r = length(v_uv);
      edgeFade = (1.0 - smoothstep(0.65, 1.0, abs(v_uv.x))) * smoothstep(0.0, 0.14, v_uv.y);
      if (r > 0.99 && abs(v_uv.x) + abs(v_uv.y) > 1.05) {
        edgeFade = 1.0 - smoothstep(0.6, 1.0, r);
      }
    }
    float alpha = 0.24 * edgeFade;
    if (alpha < 0.004) discard;
    fragColor = vec4(vec3(0.012, 0.0, 0.0) * alpha, alpha);
    return;
  }

  float caustic = pow(
    clamp(0.5 + 0.5 * sin(v_worldPos.x * 0.036 + uTime * 0.6) * cos(v_worldPos.y * 0.036 - uTime * 0.48), 0.0, 1.0),
    3.0
  );

  if (v_type > 2.5) {
    float petalEdge = 1.0 - smoothstep(0.65, 1.0, abs(v_uv.x));
    float alpha = petalEdge * 0.96;
    if (alpha < 0.01) discard;
    vec3 col = mix(vec3(0.76, 0.28, 0.22), v_color, smoothstep(0.08, 0.72, v_uv.y));
    col += vec3(0.24, 0.16, 0.06) * (1.0 - v_uv.y);
    fragColor = vec4(col * alpha, alpha);
    return;
  }

  if (v_type > 1.5) {
    float r = length(v_uv);
    float edge = 1.0 - smoothstep(0.92, 1.0, r);
    if (edge < 0.01) discard;

    float angle = atan(v_uv.y, v_uv.x);
    float vein = pow(clamp(0.5 + 0.5 * cos(angle * 18.0), 0.0, 1.0), 8.0) * (1.0 - r * 0.4);
    float rim = smoothstep(0.84, 0.96, r) * (1.0 - smoothstep(0.96, 1.0, r));
    float centerGlow = exp(-r * r * 14.0);

    vec3 col = mix(v_color * 0.85, v_color * 1.15, r * 0.6);
    col += vec3(0.18, 0.28, 0.10) * vein * 0.65;
    col += vec3(0.32, 0.20, 0.08) * centerGlow * 0.5;
    col += vec3(0.45, 0.22, 0.12) * rim * 0.45;
    col += vec3(0.32, 0.20, 0.08) * caustic * 0.25;
    fragColor = vec4(col * edge, edge);
    return;
  }

  if (v_type > 0.5) {
    float lateral = abs(v_uv.x);
    float scallop = 0.86 + 0.14 * cos(v_uv.y * 28.0);
    float mask = 1.0 - smoothstep(scallop * 0.82, scallop, lateral);
    if (mask < 0.01) discard;

    float midrib = exp(-lateral * 14.0);
    float pinnate = pow(clamp(0.5 + 0.5 * sin((v_uv.y * 16.0 - lateral * 5.2) * 3.14159), 0.0, 1.0), 5.0);
    vec3 col = v_color * (0.58 + 0.52 * v_uv.y);
    col += vec3(0.18, 0.28, 0.12) * (midrib * 0.55 + pinnate * 0.35);
    col += vec3(0.35, 0.22, 0.09) * caustic * 0.28;
    col = mix(vec3(0.24, 0.04, 0.03), col, smoothstep(0.0, 0.28, v_uv.y));
    float alpha = mask * 0.94;
    fragColor = vec4(col * alpha, alpha);
    return;
  }

  float bladeEdge = 1.0 - smoothstep(0.75, 1.0, abs(v_uv.x));
  if (bladeEdge < 0.01) discard;

  float midrib = exp(-abs(v_uv.x) * 10.0);
  vec3 tipCol = mix(v_color, vec3(0.48, 0.34, 0.14), smoothstep(0.45, 1.0, v_uv.y) * 0.6);
  vec3 col = mix(vec3(0.18, 0.03, 0.025), tipCol, smoothstep(0.0, 0.25, v_uv.y));
  col += vec3(0.22, 0.32, 0.14) * midrib * 0.4;
  col += vec3(0.36, 0.22, 0.09) * caustic * 0.3;
  float alpha = bladeEdge * (0.76 + 0.2 * (1.0 - v_uv.y * 0.4));
  fragColor = vec4(col * alpha, alpha);
}
`;

export const waveUpdateFragmentShader = `#version 300 es
precision highp float;
#define MAX_IMPULSES ${MAX_WAVE_IMPULSES}
#define HEIGHT_RANGE ${HEIGHT_RANGE}

uniform sampler2D uState;
uniform vec2 uSize;
uniform float uDamping;
uniform float uSpeed;
uniform int uImpulseCount;
uniform vec4 uImpulses[MAX_IMPULSES];
out vec4 outColor;

float decodeHeight(vec2 rg) {
  float packed = rg.x * 255.0 + rg.y * 255.0 * 256.0;
  return (packed / 65535.0 - 0.5) * HEIGHT_RANGE;
}

vec2 encodeHeight(float height) {
  float normalised = clamp(height / HEIGHT_RANGE + 0.5, 0.0, 1.0);
  float packed = floor(normalised * 65535.0 + 0.5);
  return vec2(mod(packed, 256.0), floor(packed / 256.0)) / 255.0;
}

float fetchHeight(ivec2 coord) {
  coord = clamp(coord, ivec2(0), ivec2(uSize) - 1);
  return decodeHeight(texelFetch(uState, coord, 0).rg);
}

void main() {
  ivec2 coord = ivec2(gl_FragCoord.xy);
  vec4 state = texelFetch(uState, coord, 0);
  float height = decodeHeight(state.rg);
  float previous = decodeHeight(state.ba);

  float orthogonal =
    fetchHeight(coord + ivec2(1, 0)) +
    fetchHeight(coord - ivec2(1, 0)) +
    fetchHeight(coord + ivec2(0, 1)) +
    fetchHeight(coord - ivec2(0, 1));
  float diagonal =
    fetchHeight(coord + ivec2(1, 1)) +
    fetchHeight(coord + ivec2(-1, 1)) +
    fetchHeight(coord + ivec2(1, -1)) +
    fetchHeight(coord + ivec2(-1, -1));

  // Isotropic 9-neighbour stencil, normalised so the centre coefficient is -3.
  float laplacian =
    0.5 * (orthogonal - 4.0 * height) +
    0.25 * (diagonal - 4.0 * height);
  /*
   * Damp the whole update. Scaling the height alone leaves each impulse as a
   * slow, broad swell that never quite leaves; damping the update lets sharp
   * impulses split into a travelling ring and then fade.
   */
  float next = (2.0 * height - previous + uSpeed * laplacian) * uDamping;

  for (int i = 0; i < MAX_IMPULSES; i++) {
    if (i >= uImpulseCount) break;
    vec4 impulse = uImpulses[i];
    vec2 delta = (vec2(coord) + 0.5) / uSize - impulse.xy;
    float distance = length(delta * uSize);
    float radius = max(impulse.z, 0.001);
    float edge = clamp(distance / radius, 0.0, 1.0);
    next += impulse.w * 0.5 * (1.0 + cos(3.14159265 * edge));
  }

  vec2 edge = min(vec2(coord), uSize - 1.0 - vec2(coord));
  float absorb = mix(0.986, 1.0, smoothstep(0.0, 7.0, min(edge.x, edge.y)));
  next *= absorb;
  next = clamp(next, -HEIGHT_RANGE * 0.875, HEIGHT_RANGE * 0.875);

  outColor = vec4(encodeHeight(next), encodeHeight(height));
}
`;

export const compositeFragmentShader = `#version 300 es
precision highp float;
#define HEIGHT_RANGE ${HEIGHT_RANGE}
#define REFRACTION_GAIN ${REFRACTION_GAIN}

in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uWave;
uniform vec2 uWaveSize;
uniform vec2 uResolution;
uniform float uRefraction;
uniform float uTime;
out vec4 outColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 23.34);
  return fract(p.x * p.y);
}

float decodeHeight(vec2 rg) {
  float packed = rg.x * 255.0 + rg.y * 255.0 * 256.0;
  return (packed / 65535.0 - 0.5) * HEIGHT_RANGE;
}

/**
 * Bilinear decode. The RGBA8 packing cannot use hardware filtering, so this
 * expands the four texels by hand and keeps the ripple glass smooth.
 */
float heightAt(vec2 uv) {
  vec2 maxCoord = uWaveSize - 1.0;
  vec2 pos = clamp(uv, 0.0, 1.0) * maxCoord;
  ivec2 base = ivec2(floor(pos));
  vec2 fraction = fract(pos);
  ivec2 low = clamp(base, ivec2(0), ivec2(maxCoord));
  ivec2 high = clamp(base + ivec2(1), ivec2(0), ivec2(maxCoord));

  float h00 = decodeHeight(texelFetch(uWave, low, 0).rg);
  float h10 = decodeHeight(texelFetch(uWave, ivec2(high.x, low.y), 0).rg);
  float h01 = decodeHeight(texelFetch(uWave, ivec2(low.x, high.y), 0).rg);
  float h11 = decodeHeight(texelFetch(uWave, high, 0).rg);

  return mix(
    mix(h00, h10, fraction.x),
    mix(h01, h11, fraction.x),
    fraction.y
  );
}

void main() {
  vec2 waveUv = vUv;
  vec2 texel = 1.0 / uWaveSize;

  float left = heightAt(waveUv - vec2(texel.x, 0.0));
  float right = heightAt(waveUv + vec2(texel.x, 0.0));
  float down = heightAt(waveUv - vec2(0.0, texel.y));
  float up = heightAt(waveUv + vec2(0.0, texel.y));
  float height = heightAt(waveUv);

  vec2 gradient = vec2(right - left, up - down) * 0.5;
  /*
   * A single sharp texel in the heightfield can otherwise throw the whole
   * scene hundreds of pixels sideways and duplicate strokes of the title.
   * Cap the slope, not the gentle ripples: everything below the cap keeps the
   * full Figma refraction.
   */
  float slope = length(gradient);
  if (slope > 0.35) gradient *= 0.35 / max(slope, 1e-4);
  vec2 offset =
    vec2(gradient.x, -gradient.y) * REFRACTION_GAIN * uRefraction /
    uResolution;

  float dispersion = 0.08;
  vec3 scene;
  scene.r = texture(uScene, clamp(vUv + offset, vec2(0.0), vec2(1.0))).r;
  scene.g = texture(
    uScene,
    clamp(vUv + offset * (1.0 - dispersion), vec2(0.0), vec2(1.0))
  ).g;
  scene.b = texture(
    uScene,
    clamp(vUv + offset * (1.0 - dispersion * 2.0), vec2(0.0), vec2(1.0))
  ).b;

  float crest = smoothstep(0.015, 0.28, height);
  float sparkle = pow(clamp(length(gradient) * 2.4, 0.0, 1.0), 2.4);
  scene += vec3(1.0, 0.84, 0.58) * (sparkle * 0.14 + crest * 0.045);

  // A little chromatic warmth in the troughs keeps the red water alive.
  scene.r += max(-height, 0.0) * 0.0016;

  float sheen = 0.5 + 0.5 * sin(
    waveUv.x * 9.0 + uTime * 0.38 +
    sin(waveUv.y * 7.0 - uTime * 0.24) * 2.0
  );
  scene += vec3(0.16, 0.05, 0.02) * pow(sheen, 9.0) * 0.035;

  // Fine dither to keep the broad crimson gradient band-free.
  scene += (hash21(gl_FragCoord.xy + fract(uTime)) - 0.5) * (1.6 / 255.0);

  outColor = vec4(scene, 1.0);
}
`;

export const overlayVertexShader = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 1) in float aSize;
uniform vec2 uResolution;
uniform float uPixelRatio;
void main() {
  vec2 ndc = vec2(
    aPos.x / uResolution.x * 2.0 - 1.0,
    1.0 - aPos.y / uResolution.y * 2.0
  );
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = max(1.0, aSize * uPixelRatio);
}
`;

export const overlayLineFragmentShader = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() {
  outColor = vec4(uColor.rgb * uColor.a, uColor.a);
}
`;

export const overlayPointFragmentShader = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() {
  float distance = length(gl_PointCoord - vec2(0.5));
  float edge = smoothstep(0.5, 0.30, distance);
  if (edge <= 0.002) discard;
  float alpha = uColor.a * edge;
  outColor = vec4(uColor.rgb * alpha, alpha);
}
`;

export const particleVertexShader = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
layout(location = 1) in float aSize;
layout(location = 2) in float aType;
layout(location = 3) in float aAlpha;
uniform vec2 uResolution;
out float vType;
out float vAlpha;
void main() {
  vType = aType;
  vAlpha = aAlpha;
  vec2 ndc = vec2(
    aPos.x / uResolution.x * 2.0 - 1.0,
    1.0 - aPos.y / uResolution.y * 2.0
  );
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = max(1.0, aSize);
}
`;

export const particleFragmentShader = `#version 300 es
precision highp float;
in float vType;
in float vAlpha;
out vec4 outColor;

void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  int type = int(vType + 0.5);
  vec4 color = vec4(0.0);

  if (type == 0) {
    // Pellet: ray-sphere normal approximation, diffuse+specular, warm roasted amber, meniscus ring r~0.84
    float z = sqrt(max(0.0, 1.0 - r * r));
    vec3 n = normalize(vec3(p, z));
    vec3 l = normalize(vec3(-0.35, -0.45, 0.82));
    vec3 v = vec3(0.0, 0.0, 1.0);
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(reflect(-l, n), v), 0.0), 24.0);
    vec3 base = vec3(0.72, 0.38, 0.12);
    vec3 lit = base * (0.28 + 0.85 * diff) + vec3(1.0, 0.92, 0.78) * spec * 0.55;
    float edge = smoothstep(1.0, 0.92, r);
    float meniscus = smoothstep(0.90, 0.84, r) * smoothstep(0.76, 0.84, r);
    lit += vec3(1.0, 0.9, 0.75) * meniscus * 0.35;
    float a = edge * vAlpha;
    color = vec4(lit * a, a);
  } else if (type == 1) {
    // Pellet shadow: soft radial shadow disc
    float a = smoothstep(1.0, 0.2, r) * 0.22 * vAlpha;
    color = vec4(vec3(0.01, 0.0, 0.0) * a, a);
  } else if (type == 2) {
    // Micro-bubble: thin refractive rim + upper-left specular glint
    float rim = smoothstep(1.0, 0.78, r) * smoothstep(0.55, 0.78, r);
    float core = smoothstep(1.0, 0.0, r) * 0.08;
    vec2 glintPos = vec2(-0.28, -0.32);
    float glint = smoothstep(0.22, 0.0, length(p - glintPos));
    vec3 rgb = vec3(0.85, 0.95, 1.0) * (rim * 0.55 + core) + vec3(1.0) * glint * 0.7;
    float a = (rim * 0.55 + core + glint * 0.5) * vAlpha;
    a = clamp(a, 0.0, 1.0);
    color = vec4(rgb * a, a);
  } else if (type == 3) {
    // Gulp shockwave: twin bright surface-break halo rings r~0.76 and r~0.52
    float ring1 = smoothstep(0.84, 0.76, r) * smoothstep(0.68, 0.76, r);
    float ring2 = smoothstep(0.60, 0.52, r) * smoothstep(0.44, 0.52, r);
    float a = (ring1 * 0.9 + ring2 * 0.55) * vAlpha;
    vec3 rgb = vec3(1.0, 0.95, 0.82);
    color = vec4(rgb * a, a);
  }

  outColor = color;
}
`;

export const overlayShaders = {
  vertex: overlayVertexShader,
  lineFragment: overlayLineFragmentShader,
  pointFragment: overlayPointFragmentShader,
} as const;

export const sceneShaders = {
  backgroundVertex: backgroundVertexShader,
  backgroundFragment: backgroundFragmentShader,
  titleVertex: titleVertexShader,
  titleFragment: titleFragmentShader,
  fishVertex: fishVertexShader,
  fishFragment: fishFragmentShader,
  waveUpdateFragment: waveUpdateFragmentShader,
  compositeFragment: compositeFragmentShader,
  particleVertex: particleVertexShader,
  particleFragment: particleFragmentShader,
  plantVertex: plantVertexShader,
  plantFragment: plantFragmentShader,
} as const;
