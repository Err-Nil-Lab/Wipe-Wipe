// Jumpscare 3D: kamera dipotong ke jendela tempat monster masuk, monster menggedor kaca, kaca pecah
// (kilat putih), lalu monster menerjang ke kamera sampai kepalanya memenuhi layar.
import * as THREE from "three";
import { config } from "../config";
import { glassPosition, stationPosition, windowYaw } from "./layout";
import { MonsterModel } from "./monsterModel";
import type { WindowGlass } from "./windowGlass";

const cfg = config.jumpscare;

// Di akhir terjangan kepala monster berhenti faceDistance di depan kamera. Kepala berada ±0,93 m di atas
// pinggul sepanjang badan yang condong leanEnd, jadi badan harus berhenti sejauh headReach sebelum itu.
const leanEnd = 0.65;
const faceDistance = 0.45;
const headReach = 0.93 * Math.sin(leanEnd);
const rootInward = config.view3d.stationDistance - faceDistance - headReach; // jarak badan ke dalam rumah dari kaca

export class JumpscareView {
  private readonly model = new MonsterModel();
  private t = 0;
  private broke = false;
  readonly totalSec = cfg.breakSec + cfg.growSec + cfg.holdSec;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly glass: WindowGlass,
    private readonly windowIndex: number,
    private readonly monsterX: number,
    private readonly onBreak: () => void,
  ) {
    scene.add(this.model.root);
    this.model.setFade(1);
    camera.fov = config.view3d.fov;
    camera.updateProjectionMatrix();
  }

  get done(): boolean {
    return this.t >= this.totalSec;
  }

  update(dt: number, timeSec: number) {
    this.t += dt;
    const yaw = windowYaw[this.windowIndex];

    // Kaca pecah di akhir fase menggedor.
    if (!this.broke && this.t >= cfg.breakSec) {
      this.broke = true;
      this.glass.mesh.visible = false;
      this.onBreak();
    }

    // e: 0 saat menggedor, naik ke 1 selama menerjang (makin cepat di akhir supaya terasa menerkam).
    const lunge = THREE.MathUtils.clamp((this.t - cfg.breakSec) / cfg.growSec, 0, 1);
    const e = lunge * lunge;

    const outward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const root = this.model.root;
    // Dari di luar kaca (0,22 m) sampai rootInward ke dalam rumah; badan turun sedikit supaya kepala setinggi mata.
    root.position
      .copy(glassPosition(this.windowIndex))
      .setY(THREE.MathUtils.lerp(0, -0.2, e))
      .addScaledVector(outward, 0.22 - e * (0.22 + rootInward))
      .addScaledVector(side, this.monsterX * config.view3d.monster.nearLateral * (1 - e));
    root.rotation.y = yaw;

    this.model.pose({
      walkPhase: timeSec * 30,
      walkAmount: lunge > 0 ? 0.8 : 0,
      lean: leanEnd * e,
      armsUp: 1 - e,
      knock: this.t < cfg.breakSec ? Math.abs(Math.sin(this.t * 40)) : 0, // menggedor cepat sebelum kaca pecah
      shudder: 0.6,
      timeSec,
    });

    // Kamera berdiri di depan jendela itu, dengan getaran.
    const shake = cfg.shake;
    this.camera.position.copy(stationPosition(this.windowIndex));
    this.camera.rotation.set((Math.random() - 0.5) * shake, yaw + (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, "YXZ");
  }

  dispose() {
    this.scene.remove(this.model.root);
    this.glass.mesh.visible = true;
  }
}
