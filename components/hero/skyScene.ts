/**
 * The homepage hero background as a three.js scene.
 *
 * The painted sky, clouds, meadow and grid come from a clean still of the
 * original hero artwork (birds removed), so colour and style match it exactly.
 * three.js supplies the motion the old video had:
 *   - the meadow sways: a wind shader shifts the grass and flowers sideways,
 *     most at the tips of the tall foreground clumps
 *   - birds drift across the sky and flap
 *
 * Everything is laid out in a 1600 x 900 "design" space (y up) and the camera
 * crops it like `object-fit: cover`, the way the video was cropped.
 */
import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NoColorSpace,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  WebGLRenderer,
} from 'three';

const DESIGN_W = 1600;
const DESIGN_H = 900;

// Small seeded generator so the birds start in the same places on every visit.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLATE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vP;
  void main() {
    vUv = uv;
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLATE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  varying vec2 vUv;
  varying vec2 vP;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  // How "grass green" a painted pixel is.
  float green(vec3 c) { return smoothstep(0.015, 0.09, c.g - max(c.r, c.b)); }

  // The crest of the front hill in the artwork (y up).
  float hill(float x) { return 40.0 + 195.0 * smoothstep(-200.0, 1700.0, x); }

  // A clump of tall blades: sways most at its tips, not at all at its roots.
  float clump(vec2 p, float cx, float halfWidth, float rootY, float tipY) {
    float across = exp(-pow((p.x - cx) / halfWidth, 2.0));
    float up = smoothstep(rootY, tipY, p.y) * (1.0 - smoothstep(tipY, tipY + 36.0, p.y));
    return across * up;
  }

  void main() {
    vec2 p = vP;
    vec3 still = texture2D(uMap, vUv).rgb;

    // Sway, in design pixels. Gusts roll left to right with a little local variation.
    float local = noise(p * 0.018) * 5.0;
    float wind = sin(uTime * 1.15 + p.x * 0.011 + local) * 0.62 + sin(uTime * 0.52 + p.x * 0.0035) * 0.38;

    float crest = hill(p.x);
    float meadow = 1.0 - smoothstep(crest - 26.0, crest + 6.0, p.y);
    float amount = meadow * mix(2.3, 0.6, clamp(p.y / max(crest, 1.0), 0.0, 1.0));
    amount += clump(p, 80.0, 150.0, 0.0, 262.0) * 7.5;      // tall blades, bottom left
    amount += clump(p, 600.0, 62.0, 0.0, 124.0) * 4.5;      // centre clump
    amount += clump(p, 1058.0, 60.0, 150.0, 214.0) * 3.0;   // on the crest, right of centre
    amount += clump(p, 1300.0, 130.0, 180.0, 246.0) * 3.0;  // along the crest
    amount += clump(p, 1480.0, 150.0, 30.0, 250.0) * 3.5;   // bottom right

    vec2 shift = vec2(wind * amount / 1600.0, 0.0);
    vec3 moved = texture2D(uMap, vUv - shift).rgb;

    // Inside the meadow everything moves together. Above the crest only blades
    // move, so the sky and its grid lines stay perfectly still behind them.
    float blade = max(green(moved), green(still));
    float follow = max(meadow, blade);
    gl_FragColor = vec4(mix(still, moved, follow), 1.0);
  }
`;

const BIRD_VERTEX = /* glsl */ `
  attribute vec4 aBird;   // start x, start y, size, phase
  attribute vec2 aDrift;  // speed x, speed y (design px per second)
  uniform float uTime;
  varying vec2 vUv;
  varying float vPhase;
  void main() {
    vUv = position.xy * 2.0;
    vPhase = aBird.w;
    vec2 pos = aBird.xy;
    pos.x = mod(pos.x + uTime * aDrift.x, 1800.0) - 100.0;
    pos.y = 440.0 + mod(pos.y - 440.0 + uTime * aDrift.y, 230.0);
    pos.y += sin(uTime * 0.6 + aBird.w) * 7.0;
    pos += position.xy * aBird.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
  }
`;

const BIRD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying float vPhase;

  float segment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - mix(0.085, 0.018, h);
  }

  void main() {
    // Two wings that flap; each bird keeps its own rhythm.
    float flap = sin(uTime * 5.2 + vPhase * 3.0) * 0.42 + 0.12;
    vec2 p = vec2(abs(vUv.x), vUv.y);
    float d = segment(p, vec2(0.0, -0.08), vec2(0.5, 0.12 + flap * 0.5));
    d = min(d, segment(p, vec2(0.5, 0.12 + flap * 0.5), vec2(0.88, flap * 0.7)));
    float edge = fwidth(d);
    float alpha = 1.0 - smoothstep(-edge, edge, d);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vec3(34.0, 52.0, 80.0) / 255.0, alpha * 0.9);
  }
`;

export type SkyScene = { resize: () => void; render: (timeSeconds: number) => void; dispose: () => void };

/** Resolves once the artwork has loaded and the first frame can be drawn. */
export async function createSkyScene(canvas: HTMLCanvasElement): Promise<SkyScene> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  // The artwork's pixels are already final sRGB values, so nothing should re-encode them.
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x5c8fc9, 1);

  // A smaller plate is plenty for phones; larger screens get the sharper one.
  const wide = Math.max(canvas.clientWidth, canvas.clientHeight * (DESIGN_W / DESIGN_H)) * Math.min(window.devicePixelRatio || 1, 2);
  const plate = await new TextureLoader().loadAsync(wide > 1700 ? '/images/hero-sky-2560.webp' : '/images/hero-sky-1600.webp');
  plate.colorSpace = NoColorSpace;
  plate.minFilter = LinearFilter;
  plate.magFilter = LinearFilter;
  plate.generateMipmaps = false;

  const camera = new OrthographicCamera(0, DESIGN_W, DESIGN_H, 0, -10, 10);
  const scene = new Scene();
  const time = { value: 0 };

  const plane = new PlaneGeometry(DESIGN_W, DESIGN_H);
  plane.translate(DESIGN_W / 2, DESIGN_H / 2, 0);
  const plateMaterial = new ShaderMaterial({
    vertexShader: PLATE_VERTEX,
    fragmentShader: PLATE_FRAGMENT,
    uniforms: { uMap: { value: plate }, uTime: time },
    depthTest: false,
  });
  const backdrop = new Mesh(plane, plateMaterial);
  backdrop.renderOrder = 0;
  scene.add(backdrop);

  // Birds: one instanced quad each, positioned and animated in the shader.
  const random = mulberry32(20261114);
  const between = (a: number, b: number) => a + (b - a) * random();
  const BIRDS = 8;
  const quad = new PlaneGeometry(1, 1);
  const birdGeometry = new InstancedBufferGeometry();
  birdGeometry.index = quad.index;
  birdGeometry.setAttribute('position', quad.getAttribute('position'));
  birdGeometry.instanceCount = BIRDS;
  const bird = new Float32Array(BIRDS * 4);
  const drift = new Float32Array(BIRDS * 2);
  for (let i = 0; i < BIRDS; i++) {
    bird.set([between(150, 1000), between(450, 640), i < 2 ? between(24, 30) : between(12, 20), between(0, 6.28)], i * 4);
    drift.set([between(7, 16), between(-1.2, 1.6)], i * 2);
  }
  birdGeometry.setAttribute('aBird', new InstancedBufferAttribute(bird, 4));
  birdGeometry.setAttribute('aDrift', new InstancedBufferAttribute(drift, 2));
  const birdMaterial = new ShaderMaterial({
    vertexShader: BIRD_VERTEX, fragmentShader: BIRD_FRAGMENT, uniforms: { uTime: time },
    transparent: true, depthTest: false,
  });
  const birds = new Mesh(birdGeometry, birdMaterial);
  birds.frustumCulled = false;
  birds.renderOrder = 1;
  scene.add(birds);

  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);

    // Crop the design space like object-fit: cover, centred.
    const scale = Math.max(width / DESIGN_W, height / DESIGN_H);
    const viewW = width / scale;
    const viewH = height / scale;
    camera.left = DESIGN_W / 2 - viewW / 2;
    camera.right = DESIGN_W / 2 + viewW / 2;
    camera.top = DESIGN_H / 2 + viewH / 2;
    camera.bottom = DESIGN_H / 2 - viewH / 2;
    camera.updateProjectionMatrix();
  };

  const render = (timeSeconds: number) => {
    time.value = timeSeconds;
    renderer.render(scene, camera);
  };

  const dispose = () => {
    [plane, plateMaterial, plate, quad, birdGeometry, birdMaterial].forEach((item) => item.dispose());
    renderer.dispose();
  };

  resize();
  return { resize, render, dispose };
}
