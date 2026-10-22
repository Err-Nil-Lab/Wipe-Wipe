// Kaca jendela: menampilkan Fog (grid embun dari logic/) sebagai tekstur, dan mengubah
// posisi kursor di kaca menjadi koordinat sel untuk wipe. Tidak berisi aturan game.
import * as THREE from "three";
import type { Fog } from "../logic/fog";

export type GlassMode = "overlay" | "transmission";

const overlayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Embun sebagai lapisan susu abu-abu. Noise membuat tepi usapan terlihat organik, bukan kotak-kotak.
const overlayFragment = /* glsl */ `
  uniform sampler2D uFog;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    vec2 uv = vec2(vUv.x, 1.0 - vUv.y); // baris 0 grid = atas kaca
    float fog = texture2D(uFog, uv).r;
    float n = noise(uv * vec2(18.0, 26.0)) * 0.6 + noise(uv * vec2(60.0, 90.0)) * 0.4;
    float body = smoothstep(0.30, 0.60, fog + (n - 0.5) * 0.45); // embun tebal: hampir menutup
    float haze = fog * 0.45;                                       // embun tipis: hanya mengabur
    float alpha = max(haze, body * 0.96);
    vec3 color = mix(vec3(0.62, 0.64, 0.66), vec3(0.85), n);
    gl_FragColor = vec4(color, alpha);
  }
`;

export class WindowGlass {
  readonly mesh: THREE.Mesh;
  private readonly fog: Fog;
  private readonly data: Uint8Array;
  private readonly texture: THREE.DataTexture;
  private readonly overlayMaterial: THREE.ShaderMaterial;
  private readonly transmissionMaterial: THREE.MeshPhysicalMaterial;
  mode: GlassMode = "overlay";

  constructor(fog: Fog, size: number) {
    this.fog = fog;
    this.data = new Uint8Array(fog.size * fog.size * 4);
    // Filter linear: sel 32x32 terlihat halus, bukan kotak-kotak.
    this.texture = new THREE.DataTexture(this.data, fog.size, fog.size, THREE.RGBAFormat);
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.minFilter = THREE.LinearFilter;

    this.overlayMaterial = new THREE.ShaderMaterial({
      vertexShader: overlayVertex,
      fragmentShader: overlayFragment,
      uniforms: { uFog: { value: this.texture } },
      transparent: true,
      depthWrite: false,
    });

    // Alternatif untuk dibandingkan: kaca transmisi sungguhan. Embun menaikkan roughness (kabur)
    // dan emissive (putih susu); bagian jernih tetap tembus pandang.
    this.transmissionMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      thickness: 0.02,
      roughness: 1,
      roughnessMap: this.texture, // memakai kanal hijau; ketiga kanal diisi sama
      emissive: new THREE.Color(0.5, 0.52, 0.54),
      emissiveMap: this.texture,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.overlayMaterial);
    this.mesh.renderOrder = 10; // digambar setelah pemandangan di belakangnya
  }

  setMode(mode: GlassMode) {
    this.mode = mode;
    this.mesh.material = mode === "overlay" ? this.overlayMaterial : this.transmissionMaterial;
  }

  // Salin nilai embun ke tekstur. Dipanggil tiap frame; hanya 1 KB per jendela.
  update() {
    const cells = this.fog.cells;
    for (let i = 0; i < cells.length; i++) {
      const byte = Math.round(cells[i] * 255);
      const o = i * 4;
      this.data[o] = this.data[o + 1] = this.data[o + 2] = byte;
      this.data[o + 3] = 255;
    }
    this.texture.needsUpdate = true;
  }

  // Titik di kaca yang kena sinar raycaster, dalam satuan sel (y ke bawah, sama dengan Fog).
  pick(raycaster: THREE.Raycaster): { x: number; y: number; point: THREE.Vector3 } | null {
    const hit = raycaster.intersectObject(this.mesh)[0];
    if (!hit?.uv) return null;
    const n = this.fog.size;
    return { x: hit.uv.x * n, y: (1 - hit.uv.y) * n, point: hit.point };
  }
}
