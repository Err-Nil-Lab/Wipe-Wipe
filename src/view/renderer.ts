// Renderer PS1: scene digambar ke target kecil (piksel kasar, filter NEAREST), lalu pass pasca-proses
// menulis ke kanvas yang resolusinya sama kecilnya. Kanvas diperbesar dengan CSS (pixelated) dan
// dijaga 16:9 dengan bilah hitam di sisi yang berlebih.
import * as THREE from "three";
import { config } from "../config";
import { postFragment, postVertex } from "./postShader";

const aspect = 16 / 9;

export function createRenderer(container: HTMLElement) {
  const height = config.view3d.renderHeight;
  const width = Math.round(height * aspect);

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.info.autoReset = false; // supaya info.render menghitung seluruh frame, bukan hanya pass terakhir
  container.appendChild(renderer.domElement);

  const target = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });

  const post = config.view3d.post;
  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: postVertex,
    fragmentShader: postFragment,
    uniforms: {
      tDiffuse: { value: target.texture },
      uTime: { value: 0 },
      uLevels: { value: post.levels },
      uGrain: { value: post.grain },
      uVignette: { value: post.vignette },
    },
    depthTest: false,
    depthWrite: false,
  });
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Besarkan kanvas sebesar mungkin dengan rasio 16:9.
  function fitToWindow() {
    const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
    renderer.domElement.style.width = `${Math.floor(width * scale)}px`;
    renderer.domElement.style.height = `${Math.floor(height * scale)}px`;
  }
  window.addEventListener("resize", fitToWindow);
  fitToWindow();

  function render(scene: THREE.Scene, camera: THREE.Camera, timeSec: number) {
    renderer.info.reset();
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    postMaterial.uniforms.uTime.value = timeSec;
    renderer.render(postScene, postCamera);
  }

  return { renderer, render, canvas: renderer.domElement, aspect };
}
