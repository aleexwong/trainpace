/// <reference types="@webgpu/types" />
/**
 * WebGPU renderer for the route simulator.
 *
 * Per frame: (1) re-render the sky-view LUT if the sun moved, (2) a sun shadow
 * map around the camera's focus, (3) the HDR main pass — sky, terrain, road,
 * instanced trees/markers/runner, 4× MSAA, reversed-Z — and (4) a post pass
 * that tone-maps into the canvas.
 */
import type { Lighting } from "./atmosphere";
import { lookAt, multiply, ortho, invert, perspectiveReversedInfinite, transformPoint, type Vec3 } from "./math";
import { MESH_FLOATS, boxMesh, broadleafMesh, coniferMesh, sphereMesh } from "./meshes";
import { RUNNER_MAX_PARTS } from "./gait";
import {
  INSTANCE_FLOATS,
  ROAD_HALF_WIDTH,
  ROAD_SHOULDER,
  type Forest,
  type InstanceTile,
  type Terrain,
  type TiledInstances,
} from "./world";
import { MESH_WGSL, POST_WGSL, ROAD_WGSL, SHADOW_WGSL, SKY_LUT_WGSL, SKY_WGSL, TERRAIN_WGSL } from "./shaders";

const HDR_FORMAT: GPUTextureFormat = "rgba16float";
const DEPTH_FORMAT: GPUTextureFormat = "depth32float";
const SAMPLES = 4;
const SHADOW_SIZE = 2048;
const FRAME_FLOATS = 80;

export interface WorldBuffers {
  terrain: Terrain;
  road: { vertices: Float32Array; indices: Uint32Array };
  forest: Forest;
  markers: Float32Array;
  routeLength: number;
}

export interface CameraState {
  eye: Vec3;
  target: Vec3;
  fovY: number;
  /** Centre and half-size (m) of the sun shadow box. */
  shadowCenter: Vec3;
  shadowRadius: number;
}

interface MeshDraw {
  vertices: GPUBuffer;
  vertexCount: number;
  instances: GPUBuffer;
  instanceCount: number;
  /** When present, only tiles near the camera are drawn. */
  tiles?: InstanceTile[];
}

/** Trees further than this from the camera are culled (they are sub-pixel). */
const TREE_DRAW_RADIUS = 2600;

export class WebGpuUnavailableError extends Error {}

export class SimRenderer {
  private device: GPUDevice;
  private context: GPUCanvasContext;
  private canvas: HTMLCanvasElement;
  private format: GPUTextureFormat;

  private frameBuffer: GPUBuffer;
  private frameData = new Float32Array(FRAME_FLOATS);

  private skyLut: GPUTexture;
  private shadowTex: GPUTexture;
  private colorTex?: GPUTexture;
  private resolveTex?: GPUTexture;
  private depthTex?: GPUTexture;

  private mainGroup: GPUBindGroup;
  private shadowGroup: GPUBindGroup;
  private lutGroup: GPUBindGroup;
  private postGroup?: GPUBindGroup;

  private pipes: Record<
    "lut" | "sky" | "terrain" | "road" | "mesh" | "shadowMesh" | "shadowTerrain" | "post",
    GPURenderPipeline
  >;

  private terrainVB?: GPUBuffer;
  private terrainIB?: GPUBuffer;
  private terrainIndexCount = 0;
  private roadVB?: GPUBuffer;
  private roadIB?: GPUBuffer;
  private roadIndexCount = 0;
  private meshes: MeshDraw[] = [];
  private runner!: MeshDraw;
  private lutDirty = true;
  private lighting?: Lighting;
  private routeLength = 0;
  private exposure = 1;

  /** `onLost` fires if the GPU drops the device (driver reset, OOM), not on destroy(). */
  static async create(canvas: HTMLCanvasElement, onLost?: () => void): Promise<SimRenderer> {
    if (!("gpu" in navigator) || !navigator.gpu) {
      throw new WebGpuUnavailableError("WebGPU is not available in this browser.");
    }
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) throw new WebGpuUnavailableError("No WebGPU adapter was found.");
    const device = await adapter.requestDevice();
    device.addEventListener("uncapturederror", (e) =>
      console.error("WebGPU:", (e as GPUUncapturedErrorEvent).error.message)
    );
    void device.lost.then((info) => {
      if (info.reason === "destroyed") return;
      console.error("WebGPU device lost:", info.message);
      onLost?.();
    });
    const context = canvas.getContext("webgpu");
    if (!context) throw new WebGpuUnavailableError("Could not create a WebGPU canvas context.");
    return new SimRenderer(device, context, canvas);
  }

  private constructor(device: GPUDevice, context: GPUCanvasContext, canvas: HTMLCanvasElement) {
    this.device = device;
    this.context = context;
    this.canvas = canvas;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: this.format, alphaMode: "opaque" });

    this.frameBuffer = device.createBuffer({
      size: FRAME_FLOATS * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.skyLut = device.createTexture({
      size: [256, 128],
      format: HDR_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.shadowTex = device.createTexture({
      size: [SHADOW_SIZE, SHADOW_SIZE],
      format: DEPTH_FORMAT,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    const mainLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
      ],
    });
    const frameOnlyLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      ],
    });
    const postLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "unfilterable-float" } },
      ],
    });

    this.mainGroup = device.createBindGroup({
      layout: mainLayout,
      entries: [
        { binding: 0, resource: { buffer: this.frameBuffer } },
        { binding: 1, resource: this.shadowTex.createView() },
        { binding: 2, resource: device.createSampler({ compare: "less", magFilter: "linear", minFilter: "linear" }) },
        { binding: 3, resource: this.skyLut.createView() },
        {
          binding: 4,
          resource: device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "clamp-to-edge",
          }),
        },
      ],
    });
    this.shadowGroup = device.createBindGroup({
      layout: frameOnlyLayout,
      entries: [{ binding: 0, resource: { buffer: this.frameBuffer } }],
    });
    this.lutGroup = this.shadowGroup;

    const mainPL = device.createPipelineLayout({ bindGroupLayouts: [mainLayout] });
    const framePL = device.createPipelineLayout({ bindGroupLayouts: [frameOnlyLayout] });
    const postPL = device.createPipelineLayout({ bindGroupLayouts: [postLayout] });
    this.postLayout = postLayout;

    const mod = (code: string, label: string) => device.createShaderModule({ code, label });
    const sky = mod(SKY_WGSL, "sky");
    const lut = mod(SKY_LUT_WGSL, "sky-lut");
    const terrain = mod(TERRAIN_WGSL, "terrain");
    const road = mod(ROAD_WGSL, "road");
    const mesh = mod(MESH_WGSL, "mesh");
    const shadow = mod(SHADOW_WGSL, "shadow");
    const post = mod(POST_WGSL, "post");

    const hdrTarget: GPUColorTargetState[] = [{ format: HDR_FORMAT }];
    const mainDepth = (write = true): GPUDepthStencilState => ({
      format: DEPTH_FORMAT,
      depthWriteEnabled: write,
      depthCompare: write ? "greater" : "always",
    });
    const ms: GPUMultisampleState = { count: SAMPLES };
    const prim: GPUPrimitiveState = { topology: "triangle-list", cullMode: "none" };

    const terrainBuffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: 28,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },
          { shaderLocation: 1, offset: 12, format: "float32x3" },
          { shaderLocation: 2, offset: 24, format: "float32" },
        ],
      },
    ];
    const meshBuffers: GPUVertexBufferLayout[] = [
      {
        arrayStride: MESH_FLOATS * 4,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },
          { shaderLocation: 1, offset: 12, format: "float32x3" },
          { shaderLocation: 2, offset: 24, format: "float32x3" },
        ],
      },
      {
        arrayStride: INSTANCE_FLOATS * 4,
        stepMode: "instance",
        attributes: [3, 4, 5, 6, 7].map((loc, i) => ({
          shaderLocation: loc,
          offset: i * 16,
          format: "float32x4" as GPUVertexFormat,
        })),
      },
    ];

    this.pipes = {
      lut: device.createRenderPipeline({
        layout: framePL,
        vertex: { module: lut, entryPoint: "vs" },
        fragment: { module: lut, entryPoint: "fs", targets: hdrTarget },
      }),
      sky: device.createRenderPipeline({
        layout: mainPL,
        vertex: { module: sky, entryPoint: "vs" },
        fragment: { module: sky, entryPoint: "fs", targets: hdrTarget },
        depthStencil: mainDepth(false),
        multisample: ms,
      }),
      terrain: device.createRenderPipeline({
        layout: mainPL,
        vertex: { module: terrain, entryPoint: "vs", buffers: terrainBuffers },
        fragment: { module: terrain, entryPoint: "fs", targets: hdrTarget },
        depthStencil: mainDepth(),
        multisample: ms,
        primitive: prim,
      }),
      road: device.createRenderPipeline({
        layout: mainPL,
        vertex: {
          module: road,
          entryPoint: "vs",
          buffers: [
            {
              arrayStride: 32,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" },
                { shaderLocation: 2, offset: 24, format: "float32x2" },
              ],
            },
          ],
        },
        fragment: { module: road, entryPoint: "fs", targets: hdrTarget },
        // Reversed-Z: a positive bias pulls the road toward the camera.
        depthStencil: { ...mainDepth(), depthBias: 4, depthBiasSlopeScale: 1.5 },
        multisample: ms,
        primitive: prim,
      }),
      mesh: device.createRenderPipeline({
        layout: mainPL,
        vertex: { module: mesh, entryPoint: "vs", buffers: meshBuffers },
        fragment: { module: mesh, entryPoint: "fs", targets: hdrTarget },
        depthStencil: mainDepth(),
        multisample: ms,
        primitive: prim,
      }),
      shadowMesh: device.createRenderPipeline({
        layout: framePL,
        vertex: { module: shadow, entryPoint: "vsMesh", buffers: meshBuffers },
        depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "less", depthBias: 2, depthBiasSlopeScale: 2.5 },
        primitive: prim,
      }),
      shadowTerrain: device.createRenderPipeline({
        layout: framePL,
        vertex: {
          module: shadow,
          entryPoint: "vsTerrain",
          buffers: [{ arrayStride: 28, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] }],
        },
        depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "less", depthBias: 2, depthBiasSlopeScale: 2.5 },
        primitive: prim,
      }),
      post: device.createRenderPipeline({
        layout: postPL,
        vertex: { module: post, entryPoint: "vs" },
        fragment: { module: post, entryPoint: "fs", targets: [{ format: this.format }] },
      }),
    };

    const runnerVerts = sphereMesh();
    this.runner = {
      vertices: this.upload(runnerVerts, GPUBufferUsage.VERTEX),
      vertexCount: runnerVerts.length / MESH_FLOATS,
      instances: device.createBuffer({
        size: RUNNER_MAX_PARTS * INSTANCE_FLOATS * 4,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      }),
      instanceCount: 0,
    };
  }

  private postLayout: GPUBindGroupLayout;

  private upload(data: Float32Array | Uint32Array, usage: number): GPUBuffer {
    const buf = this.device.createBuffer({
      size: Math.max(16, Math.ceil(data.byteLength / 4) * 4),
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buf, 0, data.buffer, data.byteOffset, data.byteLength);
    return buf;
  }

  setWorld(world: WorldBuffers) {
    for (const b of [this.terrainVB, this.terrainIB, this.roadVB, this.roadIB]) b?.destroy();
    for (const m of this.meshes) {
      m.vertices.destroy();
      m.instances.destroy();
    }
    this.terrainVB = this.upload(world.terrain.vertices, GPUBufferUsage.VERTEX);
    this.terrainIB = this.upload(world.terrain.indices, GPUBufferUsage.INDEX);
    this.terrainIndexCount = world.terrain.indices.length;
    this.roadVB = this.upload(world.road.vertices, GPUBufferUsage.VERTEX);
    this.roadIB = this.upload(world.road.indices, GPUBufferUsage.INDEX);
    this.roadIndexCount = world.road.indices.length;
    this.routeLength = world.routeLength;

    const draw = (verts: Float32Array, inst: Float32Array | TiledInstances): MeshDraw => {
      const data = inst instanceof Float32Array ? inst : inst.data;
      return {
        vertices: this.upload(verts, GPUBufferUsage.VERTEX),
        vertexCount: verts.length / MESH_FLOATS,
        instances: this.upload(data, GPUBufferUsage.VERTEX),
        instanceCount: data.length / INSTANCE_FLOATS,
        tiles: inst instanceof Float32Array ? undefined : inst.tiles,
      };
    };
    this.meshes = [
      draw(coniferMesh(), world.forest.conifers),
      draw(broadleafMesh(), world.forest.broadleaf),
      draw(boxMesh(), world.markers),
    ].filter((m) => m.instanceCount > 0);
  }

  setLighting(lighting: Lighting) {
    this.lighting = lighting;
    this.lutDirty = true;
    // Auto-exposure from sky brightness, holding back so dusk still reads dark.
    const lum = 0.2126 * lighting.skyAmbient[0] + 0.7152 * lighting.skyAmbient[1] + 0.0722 * lighting.skyAmbient[2];
    this.exposure = Math.min(6, 0.42 / Math.pow(lum + 0.004, 0.7));
  }

  setRunner(instances: Float32Array, count: number) {
    this.runner.instanceCount = count;
    this.device.queue.writeBuffer(this.runner.instances, 0, instances.buffer, instances.byteOffset, count * INSTANCE_FLOATS * 4);
  }

  private ensureTargets(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(1, Math.min(2560, Math.round(this.canvas.clientWidth * dpr)));
    const h = Math.max(1, Math.min(1600, Math.round(this.canvas.clientHeight * dpr)));
    if (this.colorTex && this.canvas.width === w && this.canvas.height === h) return true;
    if (!this.canvas.clientWidth || !this.canvas.clientHeight) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.colorTex?.destroy();
    this.resolveTex?.destroy();
    this.depthTex?.destroy();
    this.colorTex = this.device.createTexture({
      size: [w, h], format: HDR_FORMAT, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.resolveTex = this.device.createTexture({
      size: [w, h], format: HDR_FORMAT, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.depthTex = this.device.createTexture({
      size: [w, h], format: DEPTH_FORMAT, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.postGroup = this.device.createBindGroup({
      layout: this.postLayout,
      entries: [
        { binding: 0, resource: { buffer: this.frameBuffer } },
        { binding: 1, resource: this.resolveTex.createView() },
      ],
    });
    return true;
  }

  private writeFrame(cam: CameraState, time: number, aspect: number) {
    const L = this.lighting!;
    const f = this.frameData;
    const view = lookAt(cam.eye, cam.target, [0, 1, 0]);
    const proj = perspectiveReversedInfinite(cam.fovY, aspect, 0.15);
    const viewProj = multiply(proj, view);

    // Sun shadow box, snapped to whole texels so edges don't crawl.
    const sun = L.sunDir;
    const up: Vec3 = Math.abs(sun[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
    const D = 60000;
    const lightView = lookAt([sun[0] * D, sun[1] * D, sun[2] * D], [0, 0, 0], up);
    const c = transformPoint(lightView, cam.shadowCenter);
    const R = cam.shadowRadius;
    const texel = (2 * R) / SHADOW_SIZE;
    const cx = Math.round(c[0] / texel) * texel;
    const cy = Math.round(c[1] / texel) * texel;
    const depthRange = R * 2 + 1500;
    const lightProj = ortho(cx - R, cx + R, cy - R, cy + R, -c[2] - depthRange, -c[2] + depthRange);
    const lightViewProj = multiply(lightProj, lightView);

    f.set(viewProj, 0);
    f.set(lightViewProj, 16);
    f.set(invert(viewProj), 32);
    f.set([cam.eye[0], cam.eye[1], cam.eye[2], time], 48);
    f.set([sun[0], sun[1], sun[2], 0], 52);
    f.set([...L.sunColor, 0], 56);
    f.set([...L.skyAmbient, 0], 60);
    f.set([...L.groundAmbient, 0], 64);
    f.set([1 / 22000, 1 / 450, this.exposure, this.routeLength], 68);
    f.set([1 / SHADOW_SIZE, 0.05 / (2 * depthRange), texel * 1.5, ROAD_HALF_WIDTH], 72);
    f.set([ROAD_SHOULDER, 0, 0, 0], 76);
    this.device.queue.writeBuffer(this.frameBuffer, 0, f);
  }

  /** Draw a mesh, skipping instance tiles further than `radius` from `center`. */
  private drawMesh(pass: GPURenderPassEncoder, m: MeshDraw, center: Vec3, radius: number) {
    pass.setVertexBuffer(0, m.vertices);
    pass.setVertexBuffer(1, m.instances);
    if (!m.tiles) {
      pass.draw(m.vertexCount, m.instanceCount);
      return;
    }
    // Tile half-diagonal is folded into the radius.
    const r2 = (radius + 300) ** 2;
    for (const t of m.tiles) {
      const dx = t.x - center[0];
      const dz = t.z - center[2];
      if (dx * dx + dz * dz < r2) pass.draw(m.vertexCount, t.count, 0, t.first);
    }
  }

  render(cam: CameraState, time: number) {
    if (!this.lighting || !this.terrainVB || !this.ensureTargets()) return;
    const aspect = this.canvas.width / this.canvas.height;
    this.writeFrame(cam, time, aspect);

    const enc = this.device.createCommandEncoder();

    if (this.lutDirty) {
      const pass = enc.beginRenderPass({
        colorAttachments: [{ view: this.skyLut.createView(), loadOp: "clear", storeOp: "store", clearValue: [0, 0, 0, 1] }],
      });
      pass.setPipeline(this.pipes.lut);
      pass.setBindGroup(0, this.lutGroup);
      pass.draw(3);
      pass.end();
      this.lutDirty = false;
    }

    const meshes = [...this.meshes, this.runner].filter((m) => m.instanceCount > 0);

    // Shadow map.
    {
      const pass = enc.beginRenderPass({
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.shadowTex.createView(),
          depthClearValue: 1,
          depthLoadOp: "clear",
          depthStoreOp: "store",
        },
      });
      pass.setBindGroup(0, this.shadowGroup);
      pass.setPipeline(this.pipes.shadowTerrain);
      pass.setVertexBuffer(0, this.terrainVB);
      pass.setIndexBuffer(this.terrainIB!, "uint32");
      pass.drawIndexed(this.terrainIndexCount);
      pass.setPipeline(this.pipes.shadowMesh);
      for (const m of meshes) this.drawMesh(pass, m, cam.shadowCenter, cam.shadowRadius * 1.5);
      pass.end();
    }

    // HDR scene.
    {
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view: this.colorTex!.createView(),
            resolveTarget: this.resolveTex!.createView(),
            loadOp: "clear",
            storeOp: "discard",
            clearValue: [0, 0, 0, 1],
          },
        ],
        depthStencilAttachment: {
          view: this.depthTex!.createView(),
          depthClearValue: 0,
          depthLoadOp: "clear",
          depthStoreOp: "discard",
        },
      });
      pass.setBindGroup(0, this.mainGroup);
      pass.setPipeline(this.pipes.sky);
      pass.draw(3);

      pass.setPipeline(this.pipes.terrain);
      pass.setVertexBuffer(0, this.terrainVB);
      pass.setIndexBuffer(this.terrainIB!, "uint32");
      pass.drawIndexed(this.terrainIndexCount);

      pass.setPipeline(this.pipes.road);
      pass.setVertexBuffer(0, this.roadVB!);
      pass.setIndexBuffer(this.roadIB!, "uint32");
      pass.drawIndexed(this.roadIndexCount);

      pass.setPipeline(this.pipes.mesh);
      const treeRadius = Math.max(TREE_DRAW_RADIUS, (cam.eye[1] - cam.target[1]) * 8);
      for (const m of meshes) this.drawMesh(pass, m, cam.eye, treeRadius);
      pass.end();
    }

    // Tone map to the canvas.
    {
      const pass = enc.beginRenderPass({
        colorAttachments: [
          {
            view: this.context.getCurrentTexture().createView(),
            loadOp: "clear",
            storeOp: "store",
            clearValue: [0, 0, 0, 1],
          },
        ],
      });
      pass.setPipeline(this.pipes.post);
      pass.setBindGroup(0, this.postGroup!);
      pass.draw(3);
      pass.end();
    }

    this.device.queue.submit([enc.finish()]);
  }

  destroy() {
    for (const b of [this.terrainVB, this.terrainIB, this.roadVB, this.roadIB, this.frameBuffer]) b?.destroy();
    for (const m of [...this.meshes, this.runner]) {
      m.vertices.destroy();
      m.instances.destroy();
    }
    for (const t of [this.colorTex, this.resolveTex, this.depthTex, this.skyLut, this.shadowTex]) t?.destroy();
    this.context.unconfigure();
    this.device.destroy();
  }
}
