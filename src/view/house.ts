// Interior kabin: lantai, dinding, langit-langit, tiga dinding berjendela (tiap jendela punya dekor
// sendiri supaya mudah dibedakan), pintu terkunci, perabot, dan lentera. Semua dari primitif.
import * as THREE from "three";
import { config } from "../config";
import { roomHalf, wallHeight, wallThickness, windowYaw } from "./layout";
import { plankTexture } from "./textures";

const g = config.view3d.glassSize;
const cy = config.view3d.windowCenterY;
const frameWidth = 0.09;

function box(material: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}

type Materials = { planks: THREE.Material; frame: THREE.Material; dark: THREE.Material; cloth: THREE.Material; light: THREE.Material };

// Dinding utara dengan lubang jendela untuk kaca persegi, bingkai tebal, dan ambang. Koordinat lokal.
function windowWall(m: Materials, decor: "curtain" | "shutters" | "candle"): THREE.Group {
  const wall = new THREE.Group();
  const z = -roomHalf;
  const sideWidth = roomHalf - g / 2;
  const topHeight = wallHeight - cy - g / 2;
  const bottomHeight = cy - g / 2;

  wall.add(box(m.planks, sideWidth, wallHeight, wallThickness, -(roomHalf - sideWidth / 2), wallHeight / 2, z));
  wall.add(box(m.planks, sideWidth, wallHeight, wallThickness, roomHalf - sideWidth / 2, wallHeight / 2, z));
  wall.add(box(m.planks, g, bottomHeight, wallThickness, 0, bottomHeight / 2, z));
  wall.add(box(m.planks, g, topHeight, wallThickness, 0, wallHeight - topHeight / 2, z));

  // Bingkai: menonjol ke dalam ruangan supaya jendela terlihat jelas bahkan dari samping.
  const depth = 0.26;
  const zf = z + 0.03;
  wall.add(box(m.frame, g + 2 * frameWidth, frameWidth, depth, 0, cy + g / 2 + frameWidth / 2, zf));
  wall.add(box(m.frame, g + 2 * frameWidth, frameWidth, depth, 0, cy - g / 2 - frameWidth / 2, zf));
  wall.add(box(m.frame, frameWidth, g, depth, -g / 2 - frameWidth / 2, cy, zf));
  wall.add(box(m.frame, frameWidth, g, depth, g / 2 + frameWidth / 2, cy, zf));
  wall.add(box(m.frame, g + 0.4, 0.06, 0.32, 0, cy - g / 2 - frameWidth - 0.03, z + 0.15)); // ambang

  if (decor === "curtain") {
    // Tirai sobek di kedua sisi dan tongkatnya.
    wall.add(box(m.dark, g + 0.5, 0.04, 0.04, 0, cy + g / 2 + 0.2, z + 0.22));
    wall.add(box(m.cloth, 0.38, 1.5, 0.03, -g / 2 - 0.12, cy + 0.1, z + 0.22));
    wall.add(box(m.cloth, 0.3, 1.2, 0.03, g / 2 + 0.1, cy + 0.25, z + 0.22));
    wall.add(box(m.cloth, 0.12, 0.45, 0.03, g / 2 + 0.05, cy - 0.7, z + 0.22)); // robekan menjuntai
  } else if (decor === "shutters") {
    // Dua daun jendela terbuka menggantung ke dalam, miring.
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * (g / 2 + frameWidth), cy, z + 0.16);
      pivot.rotation.y = side * -1.25;
      pivot.add(box(m.frame, g / 2, g, 0.04, side * (g / 4), 0, 0));
      pivot.add(box(m.dark, g / 2 - 0.1, 0.05, 0.05, side * (g / 4), 0.2, 0.03)); // palang
      pivot.add(box(m.dark, g / 2 - 0.1, 0.05, 0.05, side * (g / 4), -0.2, 0.03));
      wall.add(pivot);
    }
  } else {
    // Lilin dan toples di ambang.
    wall.add(box(m.light, 0.05, 0.16, 0.05, -0.3, cy - g / 2 - frameWidth + 0.08, z + 0.2));
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    flame.position.set(-0.3, cy - g / 2 - frameWidth + 0.2, z + 0.2);
    wall.add(flame);
    wall.add(box(m.dark, 0.12, 0.18, 0.12, 0.3, cy - g / 2 - frameWidth + 0.09, z + 0.2));
  }
  return wall;
}

// Dinding selatan: pintu tertutup dengan palang melintang.
function doorWall(m: Materials): THREE.Group {
  const wall = new THREE.Group();
  const z = -roomHalf;
  wall.add(box(m.planks, 2 * roomHalf, wallHeight, wallThickness, 0, wallHeight / 2, z));
  wall.add(box(m.dark, 1.0, 2.1, 0.08, 0, 1.05, z + 0.1));
  wall.add(box(m.frame, 1.2, 0.08, 0.14, 0, 2.14, z + 0.1));
  wall.add(box(m.frame, 0.08, 2.14, 0.14, -0.6, 1.07, z + 0.1));
  wall.add(box(m.frame, 0.08, 2.14, 0.14, 0.6, 1.07, z + 0.1));
  wall.add(box(m.frame, 1.4, 0.12, 0.08, 0, 1.2, z + 0.2)); // palang pintu
  return wall;
}

function furniture(m: Materials): THREE.Group {
  const f = new THREE.Group();
  f.add(box(m.dark, 2.2, 0.02, 1.5, 0, 0.011, 0)); // karpet di tengah (jalur kamera)

  // Meja + kursi di sudut tenggara.
  f.add(box(m.frame, 1.1, 0.05, 0.7, 1.6, 0.75, 1.5));
  for (const [x, z] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) f.add(box(m.frame, 0.06, 0.75, 0.06, 1.6 + x, 0.375, 1.5 + z));
  f.add(box(m.frame, 0.4, 0.04, 0.4, 0.85, 0.45, 1.7));
  f.add(box(m.frame, 0.4, 0.45, 0.04, 0.85, 0.7, 1.9));
  f.add(box(m.frame, 0.04, 0.45, 0.04, 0.67, 0.22, 1.52));
  f.add(box(m.frame, 0.04, 0.45, 0.04, 1.03, 0.22, 1.52));

  // Ranjang di sudut barat daya.
  f.add(box(m.frame, 0.9, 0.3, 1.7, -1.9, 0.3, 1.55));
  f.add(box(m.cloth, 0.84, 0.14, 1.62, -1.9, 0.52, 1.55));
  f.add(box(m.light, 0.5, 0.1, 0.3, -1.9, 0.64, 0.9));

  // Tungku dan pipa di sudut timur laut.
  f.add(box(m.dark, 0.6, 0.9, 0.6, 2.0, 0.45, -1.9));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.1, 6), m.dark);
  pipe.position.set(2.0, 1.95, -1.9);
  f.add(pipe);

  // Rak di dinding barat bagian utara, dengan toples.
  for (const y of [0.8, 1.3, 1.8]) f.add(box(m.frame, 0.25, 0.04, 1.0, -2.3, y, -1.7));
  for (const [y, z] of [[0.9, -1.4], [0.9, -1.8], [1.4, -1.6], [1.9, -1.3], [1.9, -1.9]]) f.add(box(m.light, 0.12, 0.16, 0.12, -2.3, y, z));
  return f;
}

// Ruangan penuh. Mengembalikan lentera supaya pemanggil bisa membuatnya berkedip.
export function buildHouse(scene: THREE.Scene): { lantern: THREE.PointLight } {
  const m: Materials = {
    planks: new THREE.MeshLambertMaterial({ map: plankTexture(150, 3, 2), flatShading: true }),
    frame: lambert(0x3a3a3a),
    dark: lambert(0x161616),
    cloth: lambert(0x6a6a6a),
    light: lambert(0xb0b0b0),
  };
  const floor = new THREE.MeshLambertMaterial({ map: plankTexture(110, 4, 4, 5), flatShading: true });

  scene.add(box(floor, 2 * roomHalf, 0.1, 2 * roomHalf, 0, -0.05, 0));
  scene.add(box(m.planks, 2 * roomHalf, 0.1, 2 * roomHalf, 0, wallHeight + 0.05, 0));
  for (const x of [-1.6, 0, 1.6]) scene.add(box(m.frame, 0.16, 0.16, 2 * roomHalf, x, wallHeight - 0.08, 0)); // balok langit-langit

  // Dinding jendela diputar dari dinding utara; pintu di dinding selatan.
  const decors = ["curtain", "shutters", "candle"] as const;
  windowYaw.forEach((yaw, i) => {
    const wall = windowWall(m, decors[i]);
    wall.rotation.y = yaw;
    scene.add(wall);
  });
  const door = doorWall(m);
  door.rotation.y = Math.PI;
  scene.add(door);

  scene.add(furniture(m));

  // Lentera menggantung di tengah langit-langit.
  scene.add(box(m.dark, 0.02, 0.5, 0.02, 0, wallHeight - 0.25, 0)); // rantai
  scene.add(box(m.dark, 0.2, 0.04, 0.2, 0, 2.62, 0));
  scene.add(box(new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.12, 0.2, 0.12, 0, 2.5, 0)); // kaca lentera menyala
  const lantern = new THREE.PointLight(0xffffff, 12, 0, 2);
  lantern.position.set(0, 2.45, 0);
  scene.add(lantern);

  return { lantern };
}
