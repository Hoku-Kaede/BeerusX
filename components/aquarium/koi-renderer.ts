import { BONE_COUNT, MAX_WAVE_IMPULSES, POND } from "./koi-config";
import { overlayShaders, sceneShaders } from "./koi-shaders";
import type { KoiRig } from "./koi-rig";

export type WaveImpulse = {
  /** Top-left normalised pond coordinates. */
  x: number;
  y: number;
  /** Radius in CSS pixels. */
  radius: number;
  /** Signed height, in the wave field's pixel-scale units. */
  strength: number;
};

export type RenderFish = {
  source: number;
  /** 20 bone centres in CSS pixels, interleaved x/y. */
  bonePos: Float32Array;
  /** 20 absolute bone angles, radians. */
  boneAngle: Float32Array;
  /** CSS pixels per isotropic image unit. */
  worldScale: number;
  alpha: number;
  /** Effective depth (surface-raised). */
  depth: number;
  surfaceScale?: number;
  gulpAmount?: number;
  tint?: readonly [number, number, number];
  glow?: number;
};

export type RenderParticle = {
  x: number;
  y: number;
  size: number;
  type: number;
  alpha: number;
};

export type TitleRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FishProgram = {
  program: WebGLProgram;
  restPos: Float32Array;
  restAngle: Float32Array;
  texture: WebGLTexture;
  vao: WebGLVertexArrayObject;
  indexCount: number;
  triangles: number;
  restLength: number;
  texel: [number, number];
  buffers: WebGLBuffer[];
};

type Target = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
};

type Uniforms = Record<string, WebGLUniformLocation | null>;

const FISH_ATTRIBUTES = {
  position: 0,
  uv: 1,
  bone: 2,
  weight: 3,
} as const;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not allocate a shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Could not allocate a program");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown link error";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}

function getUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: readonly string[],
) {
  const uniforms: Uniforms = {};
  for (const name of names) {
    // Array uniforms are not reliably addressable without an explicit index on
    // every driver, so try the [0] form before giving up.
    let location = gl.getUniformLocation(program, name);
    if (!location && !name.includes("[")) {
      location = gl.getUniformLocation(program, `${name}[0]`);
    }
    uniforms[name] = location;
    if (!location && process.env.NODE_ENV !== "production") {
      console.warn(`[aquarium] Missing uniform ${name}`);
    }
  }
  return uniforms;
}

function createTarget(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  filter: number,
): Target {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error("Could not allocate a render target");

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  );
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(texture);
    throw new Error(`Incomplete framebuffer: 0x${status.toString(16)}`);
  }

  return { texture, fbo, width, height };
}

function deleteTarget(gl: WebGL2RenderingContext, target: Target) {
  gl.deleteFramebuffer(target.fbo);
  gl.deleteTexture(target.texture);
}

export class KoiRenderer {
  readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private sources = new Map<number, FishProgram>();
  private quadVao!: WebGLVertexArrayObject;
  private quadBuffer!: WebGLBuffer;
  private overlayVao!: WebGLVertexArrayObject;
  private overlayBuffer!: WebGLBuffer;
  private particleVao!: WebGLVertexArrayObject;
  private particleBuffer!: WebGLBuffer;
  private particleData = new Float32Array(0);
  private plantVao!: WebGLVertexArrayObject;
  private plantBuffer!: WebGLBuffer;
  private plantCapacity = 0;
  private programs!: Record<string, WebGLProgram>;
  private fishUniforms!: Uniforms;
  private titleUniforms!: Uniforms;
  private backgroundUniforms!: Uniforms;
  private waveUniforms!: Uniforms;
  private compositeUniforms!: Uniforms;
  private overlayUniforms!: Uniforms;
  private overlayPointUniforms!: Uniforms;
  private particleUniforms!: Uniforms;
  private plantUniforms!: Uniforms;

  private title: { texture: WebGLTexture; width: number; height: number } | null =
    null;
  private titleRect: TitleRect = { x: 0, y: 0, width: 0, height: 0 };
  private decorTexture: WebGLTexture | null = null;
  private decorWidth = 0;
  private decorHeight = 0;
  private waterRgb: [number, number, number] = [0.585, 0.03, 0.027];
  private waterCustomMix = 0;
  private nightFactor = 0;
  private lightColor: [number, number, number] = [1, 0.72, 0.42];
  private lightIntensity = 1;
  private lightKind = 0;
  private plantFloor: Float32Array = new Float32Array(0);
  private plantSurface: Float32Array = new Float32Array(0);
  private sceneTarget: Target | null = null;
  private waveTargets: [Target, Target] | null = null;
  private waveIndex = 0;

  private cssWidth = 1;
  private cssHeight = 1;
  private drawingWidth = 1;
  private drawingHeight = 1;
  private pixelRatio = 1;
  private waveWidth = 1;
  private waveHeight = 1;

  /** Development-only log of impulses sent to the heightfield. */
  readonly impulseTrace: Array<{
    step: number;
    count: number;
    strength: number;
    x: number;
    y: number;
    radius: number;
  }> = [];
  private waveSteps = 0;

  private lost = false;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is not available");
    this.gl = gl;
    this.canvas = canvas;

    this.init(gl, canvas);
  }

  private init(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this.programs = {
      background: createProgram(
        gl,
        sceneShaders.backgroundVertex,
        sceneShaders.backgroundFragment,
      ),
      title: createProgram(
        gl,
        sceneShaders.titleVertex,
        sceneShaders.titleFragment,
      ),
      fish: createProgram(
        gl,
        sceneShaders.fishVertex,
        sceneShaders.fishFragment,
      ),
      wave: createProgram(
        gl,
        sceneShaders.backgroundVertex,
        sceneShaders.waveUpdateFragment,
      ),
      composite: createProgram(
        gl,
        sceneShaders.backgroundVertex,
        sceneShaders.compositeFragment,
      ),
      overlayLine: createProgram(
        gl,
        overlayShaders.vertex,
        overlayShaders.lineFragment,
      ),
      overlayPoint: createProgram(
        gl,
        overlayShaders.vertex,
        overlayShaders.pointFragment,
      ),
      particle: createProgram(
        gl,
        sceneShaders.particleVertex,
        sceneShaders.particleFragment,
      ),
      plant: createProgram(
        gl,
        sceneShaders.plantVertex,
        sceneShaders.plantFragment,
      ),
    };

    this.fishUniforms = getUniforms(gl, this.programs.fish, [
      "uBonePos",
      "uBoneAngle",
      "uRestPos",
      "uRestAngle",
      "uWorldScale",
      "uResolution",
      "uOffset",
      "uParallax",
      "uTexture",
      "uTexel",
      "uAlpha",
      "uDepth",
      "uTime",
      "uShadow",
      "uShadowStrength",
      "uSurfaceScale",
      "uGulpAmount",
      "uTint",
      "uGlow",
    ]);
    this.titleUniforms = getUniforms(gl, this.programs.title, [
      "uRect",
      "uResolution",
      "uTexture",
      "uOpacity",
    ]);
    this.backgroundUniforms = getUniforms(gl, this.programs.background, [
      "uResolution",
      "uTime",
      "uScroll",
      "u_waterRgb",
      "u_waterCustomMix",
      "u_nightFactor",
      "u_lightColor",
      "u_lightIntensity",
      "u_lightKind",
    ]);
    this.waveUniforms = getUniforms(gl, this.programs.wave, [
      "uState",
      "uSize",
      "uDamping",
      "uSpeed",
      "uImpulseCount",
      "uImpulses",
    ]);
    this.compositeUniforms = getUniforms(gl, this.programs.composite, [
      "uScene",
      "uWave",
      "uWaveSize",
      "uResolution",
      "uRefraction",
      "uTime",
    ]);
    this.overlayUniforms = getUniforms(gl, this.programs.overlayLine, [
      "uResolution",
      "uPixelRatio",
      "uColor",
    ]);
    this.overlayPointUniforms = getUniforms(gl, this.programs.overlayPoint, [
      "uResolution",
      "uPixelRatio",
      "uColor",
    ]);
    this.particleUniforms = getUniforms(gl, this.programs.particle, [
      "uResolution",
    ]);
    this.plantUniforms = getUniforms(gl, this.programs.plant, [
      "uResolution",
      "uTime",
    ]);

    // Fullscreen triangle strip.
    this.quadBuffer = gl.createBuffer() as WebGLBuffer;
    this.quadVao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(this.quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Dynamic overlay geometry: position + point size.
    this.overlayBuffer = gl.createBuffer() as WebGLBuffer;
    this.overlayVao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(this.overlayVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 3 * 4 * 512, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 12, 8);
    gl.bindVertexArray(null);

    // Dynamic particle geometry: x, y, size, type, alpha.
    this.particleBuffer = gl.createBuffer() as WebGLBuffer;
    this.particleVao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(this.particleVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 5 * 4 * 512, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 12);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 20, 16);
    gl.bindVertexArray(null);

    // Dynamic plant geometry: pos2, uv2, colour3, type1 (8 floats).
    this.plantBuffer = gl.createBuffer() as WebGLBuffer;
    this.plantVao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(this.plantVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.plantBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * 4 * 2048, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 32, 28);
    gl.bindVertexArray(null);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    (gl as unknown as { preserveDrawingBuffer?: boolean }).preserveDrawingBuffer = true;

    canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", this.handleContextRestored, false);
  }

  private handleContextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
  };

  private handleContextRestored = () => {
    this.lost = false;
    const gl = this.gl;
    for (const source of this.sources.values()) {
      gl.deleteTexture(source.texture);
      gl.deleteVertexArray(source.vao);
      for (const buffer of source.buffers) gl.deleteBuffer(buffer);
    }
    this.sources.clear();
    for (const program of Object.values(this.programs)) {
      gl.deleteProgram(program);
    }
    this.init(gl, this.canvas);
    if (this.title) {
      gl.deleteTexture(this.title.texture);
      this.title = null;
    }
    if (this.sceneTarget) deleteTarget(gl, this.sceneTarget);
    this.sceneTarget = null;
    if (this.waveTargets) {
      deleteTarget(gl, this.waveTargets[0]);
      deleteTarget(gl, this.waveTargets[1]);
    }
    this.waveTargets = null;
  };

  registerSource(sourceIndex: number, rig: KoiRig, image: ImageBitmap | HTMLImageElement) {
    if (this.sources.has(sourceIndex)) return;
    const gl = this.gl;
    const mesh = rig.mesh;

    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    gl.bindVertexArray(vao);

    const buffers: WebGLBuffer[] = [];
    const attach = (data: Float32Array, location: number, size: number) => {
      const buffer = gl.createBuffer() as WebGLBuffer;
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    };

    attach(mesh.positions, FISH_ATTRIBUTES.position, 2);
    attach(mesh.uvs, FISH_ATTRIBUTES.uv, 2);
    attach(mesh.boneIndices, FISH_ATTRIBUTES.bone, 4);
    attach(mesh.boneWeights, FISH_ATTRIBUTES.weight, 4);

    const indexBuffer = gl.createBuffer() as WebGLBuffer;
    buffers.push(indexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    const restPos = new Float32Array(BONE_COUNT * 2);
    const restAngle = new Float32Array(BONE_COUNT);
    rig.restBones.forEach((bone, index) => {
      restPos[index * 2] = bone.x;
      restPos[index * 2 + 1] = bone.y;
      restAngle[index] = bone.angle;
    });

    this.sources.set(sourceIndex, {
      program: this.programs.fish,
      restPos,
      restAngle,
      texture,
      vao,
      indexCount: mesh.indices.length,
      triangles: mesh.triangleCount,
      restLength: rig.restLength,
      texel: [1 / Math.max(1, image.width), 1 / Math.max(1, image.height)],
      buffers,
    });
  }

  readback(): { width: number; height: number; data: Uint8Array } {
    const gl = this.gl;
    const width = Math.max(1, this.drawingWidth);
    const height = Math.max(1, this.drawingHeight);
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return { width, height, data };
  }

  /** Raw RGBA8 heightfield, for tuning the wake energy in development. */
  readWaves(): { width: number; height: number; data: Uint8Array } | null {
    if (!this.waveTargets) return null;
    const gl = this.gl;
    const width = this.waveWidth;
    const height = this.waveHeight;
    const data = new Uint8Array(width * height * 4);
    const previous = gl.getParameter(
      gl.FRAMEBUFFER_BINDING,
    ) as WebGLFramebuffer | null;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.waveTargets[this.waveIndex].fbo);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, previous);
    return { width, height, data };
  }

  get isReady() {
    return this.sources.size > 0;
  }

  /**
   * Upload the KYOKO lettering and place it in CSS pixels. The texture is
   * premultiplied on upload so its antialiased edges and mip levels stay clean
   * when it is blended over the water.
   */
  registerTitle(image: ImageBitmap | HTMLImageElement, width: number, height: number) {
    if (this.title) return;
    const gl = this.gl;
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image,
    );
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR,
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    this.title = { texture, width, height };
  }

  setTitleRect(rect: TitleRect | null) {
    if (!rect) {
      this.titleRect = { x: 0, y: 0, width: 0, height: 0 };
      return;
    }
    if (
      !Number.isFinite(rect.x) ||
      !Number.isFinite(rect.y) ||
      !Number.isFinite(rect.width) ||
      !Number.isFinite(rect.height) ||
      rect.width < 4 ||
      rect.height < 4
    ) {
      return;
    }
    this.titleRect = rect;
  }

  get stats() {
    let triangles = 0;
    for (const source of this.sources.values()) triangles += source.triangles;
    return {
      webgl: true,
      sources: this.sources.size,
      triangles,
      title: Boolean(this.title),
      titleRect: {
        x: Math.round(this.titleRect.x),
        y: Math.round(this.titleRect.y),
        width: Math.round(this.titleRect.width),
        height: Math.round(this.titleRect.height),
      },
      cssWidth: this.cssWidth,
      cssHeight: this.cssHeight,
      pixelRatio: Number(this.pixelRatio.toFixed(3)),
      drawingWidth: this.drawingWidth,
      drawingHeight: this.drawingHeight,
      waveWidth: this.waveWidth,
      waveHeight: this.waveHeight,
      bones: BONE_COUNT,
    };
  }

  setSize(cssWidth: number, cssHeight: number) {
    const gl = this.gl;
    const width = Math.max(1, Math.round(cssWidth));
    const height = Math.max(1, Math.round(cssHeight));
    let ratio = Math.min(window.devicePixelRatio || 1, POND.render.maxDpr);
    const pixels = width * height * ratio * ratio;
    if (pixels > POND.render.maxPixels) {
      ratio = Math.sqrt(POND.render.maxPixels / Math.max(1, width * height));
    }
    ratio = Math.max(0.8, Math.min(ratio, POND.render.maxDpr));

    const drawingWidth = Math.max(1, Math.round(width * ratio));
    const drawingHeight = Math.max(1, Math.round(height * ratio));

    const sizeChanged =
      width !== this.cssWidth ||
      height !== this.cssHeight ||
      Math.abs(ratio - this.pixelRatio) > 0.01;

    this.cssWidth = width;
    this.cssHeight = height;
    this.pixelRatio = ratio;
    this.drawingWidth = drawingWidth;
    this.drawingHeight = drawingHeight;

    if (this.canvas.width !== drawingWidth || this.canvas.height !== drawingHeight) {
      this.canvas.width = drawingWidth;
      this.canvas.height = drawingHeight;
    }

    if (
      !this.sceneTarget ||
      this.sceneTarget.width !== drawingWidth ||
      this.sceneTarget.height !== drawingHeight
    ) {
      if (this.sceneTarget) deleteTarget(gl, this.sceneTarget);
      this.sceneTarget = createTarget(
        gl,
        drawingWidth,
        drawingHeight,
        gl.LINEAR,
      );
    }

    /*
     * Keep the heightfield's texels a constant size in CSS pixels. A fixed
     * 256-cell grid on the long edge made the same ripple twice as steep (and
     * twice as fast) on a wide desktop as on the stage the pond was tuned on,
     * which over-refracted the title into visible loops.
     */
    const gridScale = Math.min(
      1 / POND.wave.texelPx,
      POND.wave.maxGrid / Math.max(width, height),
    );
    const waveWidth = Math.max(64, Math.round(width * gridScale));
    const waveHeight = Math.max(64, Math.round(height * gridScale));

    if (
      !this.waveTargets ||
      waveWidth !== this.waveWidth ||
      waveHeight !== this.waveHeight
    ) {
      if (this.waveTargets) {
        deleteTarget(gl, this.waveTargets[0]);
        deleteTarget(gl, this.waveTargets[1]);
      }
      this.waveWidth = waveWidth;
      this.waveHeight = waveHeight;
      this.waveTargets = [
        createTarget(gl, waveWidth, waveHeight, gl.NEAREST),
        createTarget(gl, waveWidth, waveHeight, gl.NEAREST),
      ];
      this.waveIndex = 0;
      this.clearWaves();
    }

    gl.viewport(0, 0, drawingWidth, drawingHeight);

    return sizeChanged;
  }

  clearWaves() {
    if (!this.waveTargets) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.5, 0.5, 0.5, 0.5);
    for (const target of this.waveTargets) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.waveIndex = 0;
  }

  stepWaves(
    damping: number,
    speed: number,
    impulses: readonly WaveImpulse[],
  ) {
    if (!this.waveTargets || this.lost) return;
    const gl = this.gl;
    const source = this.waveTargets[this.waveIndex];
    const destination = this.waveTargets[1 - this.waveIndex];

    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.fbo);
    gl.viewport(0, 0, this.waveWidth, this.waveHeight);
    gl.disable(gl.BLEND);
    gl.useProgram(this.programs.wave);
    gl.bindVertexArray(this.quadVao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(this.waveUniforms.uState, 0);
    gl.uniform2f(this.waveUniforms.uSize, this.waveWidth, this.waveHeight);
    gl.uniform1f(this.waveUniforms.uDamping, damping);
    gl.uniform1f(this.waveUniforms.uSpeed, speed);

    const packed = new Float32Array(MAX_WAVE_IMPULSES * 4);
    const count = Math.min(impulses.length, MAX_WAVE_IMPULSES);
    const radiusScale = this.waveWidth / Math.max(1, this.cssWidth);
    this.waveSteps += 1;
    for (let index = 0; index < count; index += 1) {
      const impulse = impulses[index];
      packed[index * 4] = impulse.x;
      packed[index * 4 + 1] = 1 - impulse.y;
      packed[index * 4 + 2] = Math.max(
        0.75,
        impulse.radius * radiusScale,
      );
      packed[index * 4 + 3] = impulse.strength;
      if (this.impulseTrace.length > 400) this.impulseTrace.shift();
      this.impulseTrace.push({
        step: this.waveSteps,
        count,
        strength: Number(impulse.strength.toFixed(3)),
        x: Number(impulse.x.toFixed(3)),
        y: Number(impulse.y.toFixed(3)),
        radius: Number(packed[index * 4 + 2].toFixed(2)),
      });
    }
    gl.uniform1i(this.waveUniforms.uImpulseCount, count);
    gl.uniform4fv(this.waveUniforms.uImpulses, packed);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.waveIndex = 1 - this.waveIndex;
  }

  render(
    fish: readonly RenderFish[],
    time: number,
    refraction: number,
    overlay: boolean,
    scroll = 0,
    particles: readonly RenderParticle[] = [],
  ) {
    if (this.lost || !this.sceneTarget || !this.waveTargets) return;
    const gl = this.gl;
    const sorted = fish
      .filter((entry) => entry.alpha > 0.002)
      .sort((a, b) => a.depth - b.depth);
    const pelletShadows = particles.filter((p) => p.type === 1 && p.alpha > 0.001);
    const floating = particles.filter((p) => (p.type === 0 || p.type === 2 || p.type === 3) && p.alpha > 0.001);

    // 1. Scene: riverbed, caustics.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneTarget.fbo);
    gl.viewport(0, 0, this.drawingWidth, this.drawingHeight);
    gl.disable(gl.BLEND);
    gl.useProgram(this.programs.background);
    gl.bindVertexArray(this.quadVao);
    gl.uniform2f(
      this.backgroundUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );
    gl.uniform1f(this.backgroundUniforms.uTime, time);
    gl.uniform1f(this.backgroundUniforms.uScroll, scroll);
    gl.uniform3f(
      this.backgroundUniforms.u_waterRgb,
      this.waterRgb[0],
      this.waterRgb[1],
      this.waterRgb[2],
    );
    gl.uniform1f(this.backgroundUniforms.u_waterCustomMix, this.waterCustomMix);
    gl.uniform1f(this.backgroundUniforms.u_nightFactor, this.nightFactor);
    gl.uniform3f(
      this.backgroundUniforms.u_lightColor,
      this.lightColor[0],
      this.lightColor[1],
      this.lightColor[2],
    );
    gl.uniform1f(this.backgroundUniforms.u_lightIntensity, this.lightIntensity);
    gl.uniform1f(this.backgroundUniforms.u_lightKind, this.lightKind);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 2. KYOKO lettering on pond floor.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    if (this.title && this.titleRect.width > 0) {
      gl.useProgram(this.programs.title);
      gl.bindVertexArray(this.quadVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.title.texture);
      gl.uniform1i(this.titleUniforms.uTexture, 0);
      gl.uniform1f(this.titleUniforms.uOpacity, POND.render.titleOpacity);
      gl.uniform4f(
        this.titleUniforms.uRect,
        this.titleRect.x,
        this.titleRect.y,
        this.titleRect.width,
        this.titleRect.height,
      );
      gl.uniform2f(
        this.titleUniforms.uResolution,
        this.cssWidth,
        this.cssHeight,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // 3. Decor and plaque, drawn under the fish and under the wave refraction.
    if (this.decorTexture) this.drawDecor();

    // 4. Riverbed plant pass, before the fish.
    if (this.plantFloor.length) this.drawPlants(this.plantFloor);

    // 5. Pellet riverbed shadows.
    if (pelletShadows.length) this.drawParticles(pelletShadows);

    // 6. Depth-sorted fish shadows, then depth-sorted fish bodies.
    for (const entry of sorted) this.drawFish(entry, time, true, scroll);
    for (const entry of sorted) this.drawFish(entry, time, false, scroll);

    // 7. Surface plants, above the fish.
    if (this.plantSurface.length) this.drawPlants(this.plantSurface);

    // 8. Floating pellets, micro-bubbles, gulp shockwaves.
    if (floating.length) this.drawParticles(floating);

    // 9. Composite refracted scene.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.drawingWidth, this.drawingHeight);
    gl.disable(gl.BLEND);
    gl.useProgram(this.programs.composite);
    gl.bindVertexArray(this.quadVao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTarget.texture);
    gl.uniform1i(this.compositeUniforms.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.waveTargets[this.waveIndex].texture);
    gl.uniform1i(this.compositeUniforms.uWave, 1);
    gl.uniform2f(
      this.compositeUniforms.uWaveSize,
      this.waveWidth,
      this.waveHeight,
    );
    gl.uniform2f(
      this.compositeUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );
    gl.uniform1f(
      this.compositeUniforms.uRefraction,
      POND.render.refractionPx * refraction,
    );
    gl.uniform1f(this.compositeUniforms.uTime, time);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);

    if (overlay) this.drawOverlay(sorted, scroll);
  }

  setWaterState(
    rgb: readonly [number, number, number],
    customMix: number,
    nightFactor: number,
    lightColor: readonly [number, number, number],
    lightIntensity: number,
    lightKind: number,
  ) {
    this.waterRgb = [rgb[0], rgb[1], rgb[2]];
    this.waterCustomMix = customMix;
    this.nightFactor = nightFactor;
    this.lightColor = [lightColor[0], lightColor[1], lightColor[2]];
    this.lightIntensity = lightIntensity;
    this.lightKind = lightKind;
  }

  setPlantGeometry(floor: Float32Array, surface: Float32Array) {
    this.plantFloor = floor;
    this.plantSurface = surface;
  }

  setDecorCanvas(canvas: HTMLCanvasElement) {
    const gl = this.gl;
    if (!this.decorTexture) {
      this.decorTexture = gl.createTexture();
    }
    if (!this.decorTexture) return;
    this.decorWidth = canvas.width;
    this.decorHeight = canvas.height;
    gl.bindTexture(gl.TEXTURE_2D, this.decorTexture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      canvas,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  }

  private drawDecor() {
    if (!this.decorTexture || !this.decorWidth || !this.decorHeight) return;
    const gl = this.gl;
    gl.useProgram(this.programs.title);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.decorTexture);
    gl.uniform1i(this.titleUniforms.uTexture, 0);
    gl.uniform1f(this.titleUniforms.uOpacity, 1);
    gl.uniform4f(
      this.titleUniforms.uRect,
      0,
      0,
      this.cssWidth,
      this.cssHeight,
    );
    gl.uniform2f(
      this.titleUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  private drawPlants(data: Float32Array) {
    if (!data.length) return;
    const gl = this.gl;
    const vertices = data.length / 8;
    const needed = data.byteLength;
    gl.useProgram(this.programs.plant);
    gl.bindVertexArray(this.plantVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.plantBuffer);
    if (needed > this.plantCapacity) {
      this.plantCapacity = Math.max(needed, this.plantCapacity * 2, 32_768);
      gl.bufferData(gl.ARRAY_BUFFER, this.plantCapacity, gl.DYNAMIC_DRAW);
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
    gl.uniform2f(this.plantUniforms.uResolution, this.cssWidth, this.cssHeight);
    gl.uniform1f(this.plantUniforms.uTime, performance.now() / 1000);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES, 0, vertices);
    gl.bindVertexArray(null);
  }

  private drawParticles(particles: readonly RenderParticle[]) {
    if (!particles.length) return;
    const gl = this.gl;
    const count = particles.length;
    const needed = count * 5;
    if (this.particleData.length < needed) this.particleData = new Float32Array(needed * 2);
    for (let i = 0; i < count; i += 1) {
      const p = particles[i];
      const o = i * 5;
      this.particleData[o] = p.x;
      this.particleData[o + 1] = p.y;
      this.particleData[o + 2] = p.size;
      this.particleData[o + 3] = p.type;
      this.particleData[o + 4] = p.alpha;
    }
    gl.useProgram(this.programs.particle);
    gl.bindVertexArray(this.particleVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.particleData.subarray(0, needed), gl.DYNAMIC_DRAW);
    gl.uniform2f(this.particleUniforms.uResolution, this.cssWidth, this.cssHeight);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.bindVertexArray(null);
  }

  private drawFish(
    entry: RenderFish,
    time: number,
    shadow: boolean,
    scroll: number,
  ) {
    const gl = this.gl;
    const source = this.sources.get(entry.source);
    if (!source) return;

    gl.useProgram(source.program);
    gl.bindVertexArray(source.vao);
    gl.uniform2fv(this.fishUniforms.uBonePos, entry.bonePos);
    gl.uniform1fv(this.fishUniforms.uBoneAngle, entry.boneAngle);
    gl.uniform2fv(this.fishUniforms.uRestPos, source.restPos);
    gl.uniform1fv(this.fishUniforms.uRestAngle, source.restAngle);
    gl.uniform1f(this.fishUniforms.uWorldScale, entry.worldScale);
    gl.uniform2f(
      this.fishUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );

    // Near koi lag the page a little less than far koi, so scrolling opens
    // up the depth of the pond instead of sliding a flat picture.
    gl.uniform1f(
      this.fishUniforms.uParallax,
      this.parallaxOffset(scroll, entry.depth),
    );

    const shadowScale = 0.78 + entry.depth * 0.5;
    gl.uniform2f(
      this.fishUniforms.uOffset,
      shadow ? POND.render.shadowX * shadowScale : 0,
      shadow ? POND.render.shadowY * shadowScale : 0,
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform1i(this.fishUniforms.uTexture, 0);
    gl.uniform2f(this.fishUniforms.uTexel, source.texel[0], source.texel[1]);
    gl.uniform1f(this.fishUniforms.uAlpha, entry.alpha);
    gl.uniform1f(this.fishUniforms.uDepth, entry.depth);
    gl.uniform1f(this.fishUniforms.uTime, time);
    gl.uniform1f(this.fishUniforms.uShadow, shadow ? 1 : 0);
    gl.uniform1f(
      this.fishUniforms.uShadowStrength,
      0.36 + entry.depth * 0.2,
    );
    gl.uniform1f(this.fishUniforms.uSurfaceScale, entry.surfaceScale ?? 1);
    gl.uniform1f(this.fishUniforms.uGulpAmount, entry.gulpAmount ?? 0);
    const tint = entry.tint ?? [1, 1, 1];
    gl.uniform3f(this.fishUniforms.uTint, tint[0], tint[1], tint[2]);
    gl.uniform1f(this.fishUniforms.uGlow, entry.glow ?? 0);

    gl.drawElements(
      gl.TRIANGLES,
      source.indexCount,
      gl.UNSIGNED_SHORT,
      0,
    );
    gl.bindVertexArray(null);
  }

  private parallaxOffset(scroll: number, depth: number) {
    const clamped = Math.min(1, Math.max(0, depth));
    return (
      scroll *
      (POND.render.parallaxFar +
        (POND.render.parallaxNear - POND.render.parallaxFar) * clamped)
    );
  }

  private drawOverlay(fish: readonly RenderFish[], scroll: number) {
    if (!fish.length) return;
    const gl = this.gl;
    const values: number[] = [];
    const pointSize = POND.render.overlayPoint;
    const headSize = POND.render.overlayHead;

    for (const entry of fish) {
      const parallax = this.parallaxOffset(scroll, entry.depth);
      for (let bone = 0; bone < BONE_COUNT; bone += 1) {
        values.push(
          entry.bonePos[bone * 2],
          entry.bonePos[bone * 2 + 1] + parallax,
          bone === 0 ? headSize : pointSize,
        );
      }
    }
    const pointCount = fish.length * BONE_COUNT;

    for (const entry of fish) {
      const parallax = this.parallaxOffset(scroll, entry.depth);
      for (let bone = 0; bone < BONE_COUNT - 1; bone += 1) {
        values.push(
          entry.bonePos[bone * 2],
          entry.bonePos[bone * 2 + 1] + parallax,
          0,
          entry.bonePos[bone * 2 + 2],
          entry.bonePos[bone * 2 + 3] + parallax,
          0,
        );
      }
    }
    const lineCount = fish.length * (BONE_COUNT - 1) * 2;

    gl.bindVertexArray(this.overlayVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.overlayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.DYNAMIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(this.programs.overlayLine);
    gl.uniform2f(
      this.overlayUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );
    gl.uniform1f(this.overlayUniforms.uPixelRatio, this.pixelRatio);
    gl.uniform4f(this.overlayUniforms.uColor, 1.0, 0.84, 0.58, 0.55);
    gl.lineWidth(POND.render.overlayLine);
    gl.drawArrays(gl.LINES, pointCount, lineCount);

    gl.useProgram(this.programs.overlayPoint);
    gl.uniform2f(
      this.overlayPointUniforms.uResolution,
      this.cssWidth,
      this.cssHeight,
    );
    gl.uniform1f(this.overlayPointUniforms.uPixelRatio, this.pixelRatio);
    gl.uniform4f(
      this.overlayPointUniforms.uColor,
      1.0,
      0.95,
      0.82,
      0.92,
    );
    gl.drawArrays(gl.POINTS, 0, pointCount);
    gl.bindVertexArray(null);
  }

  destroy() {
    const gl = this.gl;
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.handleContextLost,
      false,
    );

    for (const source of this.sources.values()) {
      gl.deleteTexture(source.texture);
      gl.deleteVertexArray(source.vao);
      for (const buffer of source.buffers) gl.deleteBuffer(buffer);
    }
    this.sources.clear();

    if (this.title) {
      gl.deleteTexture(this.title.texture);
      this.title = null;
    }

    if (this.sceneTarget) deleteTarget(gl, this.sceneTarget);
    this.sceneTarget = null;
    if (this.waveTargets) {
      deleteTarget(gl, this.waveTargets[0]);
      deleteTarget(gl, this.waveTargets[1]);
    }
    this.waveTargets = null;

    gl.deleteVertexArray(this.quadVao);
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteVertexArray(this.overlayVao);
    gl.deleteBuffer(this.overlayBuffer);
    if (this.particleVao) gl.deleteVertexArray(this.particleVao);
    if (this.particleBuffer) gl.deleteBuffer(this.particleBuffer);
    if (this.plantVao) gl.deleteVertexArray(this.plantVao);
    if (this.plantBuffer) gl.deleteBuffer(this.plantBuffer);
    if (this.decorTexture) gl.deleteTexture(this.decorTexture);
    this.decorTexture = null;
    for (const program of Object.values(this.programs)) {
      gl.deleteProgram(program);
    }
  }
}
