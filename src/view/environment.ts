// Dunia di luar rumah: tanah, jalur tanah di depan tiap jendela (jalur monster), pagar patah, batu,
// hutan pinus, dan cahaya (bulan + sinar lentera yang jatuh ke halaman dari tiap jendela).
// Hutan, batu, dan pagar memakai instancing supaya draw call tetap sedikit.
import * as THREE from "three";
import { glassPosition, roomHalf, windowYaw } from "./layout";
import { buildMist } from "./mist";
import { buildSky, moonDirection } from "./sky";
import { speckleTexture } from "./textures";

// Pengacak dengan seed tetap supaya dunia selalu sama.
function seededRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Posisi (x, z) dalam koordinat jalur jendela: forward = jarak keluar dari rumah, lateral = geser ke samping.
function laneCoords(x: number, z: number, yaw: number) {
  return { forward: -(x * Math.sin(yaw) + z * Math.cos(yaw)), lateral: x * Math.cos(yaw) - z * Math.sin(yaw) };
}

function nearHouse(x: number, z: number): boolean {
  return Math.abs(x) < roomHalf + 1 && Math.abs(z) < roomHalf + 1;
}

function inLane(x: number, z: number, halfWidth: number): boolean {
  return windowYaw.some((yaw) => {
    const { forward, lateral } = laneCoords(x, z, yaw);
    return forward > roomHalf && Math.abs(lateral) < halfWidth;
  });
}

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, count: number) {
  return new THREE.InstancedMesh(geometry, material, count);
}

function forest(scene: THREE.Scene, count: number) {
  const dark = new THREE.MeshLambertMaterial({ color: 0x1a1a1a, flatShading: true });
  const trunk = instanced(new THREE.CylinderGeometry(0.1, 0.16, 1.2, 5), dark, count);
  const lower = instanced(new THREE.ConeGeometry(0.95, 2.2, 6), dark, count);
  const upper = instanced(new THREE.ConeGeometry(0.65, 1.8, 6), dark, count);
  const random = seededRandom(7);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const noRotation = new THREE.Quaternion();

  let placed = 0;
  while (placed < count) {
    const angle = random() * Math.PI * 2;
    const radius = 4 + random() * 24;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (nearHouse(x, z) || inLane(x, z, 2.4)) continue; // jalur di depan jendela dikosongkan
    const s = 0.8 + random() * 0.9;
    scale.set(s, s, s);
    for (const [mesh, y] of [[trunk, 0.6], [lower, 1.9], [upper, 3.1]] as const) {
      mesh.setMatrixAt(placed, matrix.compose(position.set(x, y * s, z), noRotation, scale));
    }
    placed++;
  }
  scene.add(trunk, lower, upper);
}

function rocks(scene: THREE.Scene, count: number) {
  const mesh = instanced(new THREE.DodecahedronGeometry(0.4, 0), new THREE.MeshLambertMaterial({ color: 0x2a2a2a, flatShading: true }), count);
  const random = seededRandom(21);
  const matrix = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  let placed = 0;
  while (placed < count) {
    const angle = random() * Math.PI * 2;
    const radius = 3.5 + random() * 18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (nearHouse(x, z) || inLane(x, z, 1.1)) continue; // jalur tengah tetap bersih
    const s = 0.5 + random() * 1.1;
    quaternion.setFromEuler(euler.set(random() * 3, random() * 3, random() * 3));
    mesh.setMatrixAt(placed, matrix.compose(new THREE.Vector3(x, 0.1 * s, z), quaternion, new THREE.Vector3(s, s * 0.6, s)));
    placed++;
  }
  scene.add(mesh);
}

// Jalur tanah lebih terang daripada rumput di depan tiap jendela, dan pagar patah di kedua sisinya.
function lanes(scene: THREE.Scene) {
  const pathMaterial = new THREE.MeshLambertMaterial({ map: speckleTexture(120, 2, 10, 4), flatShading: true });
  const wood = new THREE.MeshLambertMaterial({ color: 0x242424, flatShading: true });
  const postCount = windowYaw.length * 2 * 6;
  const posts = instanced(new THREE.BoxGeometry(0.09, 1.05, 0.09), wood, postCount);
  const rails = instanced(new THREE.BoxGeometry(0.05, 0.06, 1.5), wood, postCount);
  const random = seededRandom(33);
  const matrix = new THREE.Matrix4();
  const euler = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const outward = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let n = 0;

  windowYaw.forEach((yaw, i) => {
    outward.set(-Math.sin(yaw), 0, -Math.cos(yaw)); // searah pandangan kamera di jendela itu
    side.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const center = glassPosition(i).clone().setY(-0.015).addScaledVector(outward, 0.2 + 7);
    const path = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 14), pathMaterial);
    path.rotation.set(-Math.PI / 2, 0, yaw); // yaw memutar bidang mengelilingi sumbu tegak
    path.position.copy(center);
    scene.add(path);

    for (const sign of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const forward = roomHalf + 2.5 + k * 1.6;
        const base = new THREE.Vector3().addScaledVector(outward, forward).addScaledVector(side, sign * 1.5 + (random() - 0.5) * 0.2);
        const lean = (random() - 0.5) * 0.35; // pagar miring dan sebagian rusak
        quaternion.setFromAxisAngle(up, yaw).multiply(new THREE.Quaternion().setFromEuler(euler.set(lean, 0, lean)));
        posts.setMatrixAt(n, matrix.compose(new THREE.Vector3(base.x, 0.5, base.z), quaternion, new THREE.Vector3(1, 1, 1)));
        const hasRail = random() > 0.35; // sebagian palang hilang
        rails.setMatrixAt(n, matrix.compose(new THREE.Vector3(base.x - outward.x * 0.8, hasRail ? 0.75 : -10, base.z - outward.z * 0.8), new THREE.Quaternion().setFromAxisAngle(up, yaw), new THREE.Vector3(1, 1, 1)));
        n++;
      }
    }
  });
  scene.add(posts, rails);
}

// Penanda khas di halaman KIRI (pohon mati) dan KANAN (gubuk kecil) supaya tiap jendela mudah dikenali.
function landmarks(scene: THREE.Scene) {
  const wood = new THREE.MeshLambertMaterial({ color: 0x1c1c1c, flatShading: true });
  const place = (object: THREE.Object3D, windowIndex: number, forward: number, lateral: number) => {
    const yaw = windowYaw[windowIndex];
    const outward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    object.position.copy(outward.multiplyScalar(forward)).addScaledVector(side, lateral);
    object.rotation.y = yaw;
    scene.add(object);
  };

  // Pohon mati: batang tinggi dengan dahan telanjang miring.
  const deadTree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 5, 5), wood);
  trunk.position.y = 2.5;
  deadTree.add(trunk);
  for (const [y, tilt, length] of [[3.2, 0.9, 1.6], [3.8, -0.8, 1.3], [4.4, 0.6, 1.0]]) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, length, 4), wood);
    branch.position.set(Math.sin(tilt) * length * 0.5, y, 0);
    branch.rotation.z = -tilt;
    deadTree.add(branch);
  }
  place(deadTree, 0, 6, 2.6);

  // Gubuk: dinding kotak dan atap pelana dari dua papan miring.
  const shed = new THREE.Group();
  shed.add(new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 1.6), wood));
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.1), wood);
    roof.position.set(0, 1.85, side * 0.45);
    roof.rotation.x = side * 0.5;
    shed.add(roof);
  }
  shed.children[0].position.y = 0.8;
  place(shed, 2, 6.5, -3.0);
}

// Sinar dari dalam rumah yang jatuh ke halaman di depan tiap jendela.
function windowLight(scene: THREE.Scene) {
  windowYaw.forEach((yaw, i) => {
    const outward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const spot = new THREE.SpotLight(0xffffff, 18, 16, 0.6, 0.7, 1.5);
    spot.position.copy(glassPosition(i)).addScaledVector(outward, -0.3);
    spot.target.position.copy(glassPosition(i)).addScaledVector(outward, 6).setY(0);
    scene.add(spot, spot.target);
  });
}

export function buildEnvironment(scene: THREE.Scene) {
  buildSky(scene);
  const mist = buildMist(scene);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshLambertMaterial({ map: speckleTexture(70, 80, 80), flatShading: true }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  forest(scene, 260);
  rocks(scene, 40);
  lanes(scene);
  landmarks(scene);
  windowLight(scene);

  // Bulan dari arah yang sama dengan bulan di langit. Permukaan yang menghadap rumah tetap gelap,
  // jadi monster terlihat sebagai siluet.
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303030, 0.5));
  const moonLight = new THREE.DirectionalLight(0xffffff, 0.9);
  moonLight.position.copy(moonDirection).multiplyScalar(50);
  scene.add(moonLight);

  return { update: (timeSec: number) => mist.update(timeSec) };
}
